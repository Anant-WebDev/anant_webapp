import { Loader, Plus, Send, Trash2, UserPlus, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { DeleteTeam } from '@/lib/actions/DeleteTeam';

import GradientButton from '../ui/GradientButton';
import Modal from '../ui/Modal';
import StatusModal from '../ui/StatusModal';

interface leader{
  id : string;
  name : string;
  roll_number : string;
}

interface Team {
  team_id: string;
  team_name: string;
  team_leader: leader;
  team_members: string[];
}

interface Invitation {
  request_id: string;
  teamName: string;
  team_id: string;
  team_leader: string;
  request_time: Date;
}

interface StatusMessage {
  type: 'success' | 'error' | 'confirm';
  title: string;
  message: string;
}

const TeamDashboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);

  const [memberTeams, setMemberTeams] = useState<Team[]>([]);

  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusModal, setStatusModal] = useState<StatusMessage | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [refresh, set_refresh] = useState<boolean>(false);

  // New state for team details modal
  const [isTeamDetailsOpen, setIsTeamDetailsOpen] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
  });

  const [newMemberRoll, setNewMemberRoll] = useState('');

  useEffect(() => {
    async function getData() {
      const details = await fetch(`/api/teams`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await details.json();

      const teams_member = response.teams_member;
      const modified_teams_member = [];
      for (let i = 0; i < teams_member.length; i++) {
        modified_teams_member.push({
          team_id: teams_member[i].team_id,
          team_name: teams_member[i].team_name,
          team_members: teams_member[i].team_members.map((el: any) =>
            String(el.roll_number)
          ),
          team_leader: String(teams_member[i].team_leader.roll_number),
        });
      }

      const teams_leaded = response.teams_leaded;
      const modified_teams_leaded = [];
      for (let i = 0; i < teams_leaded.length; i++) {
        modified_teams_leaded.push({
          team_id: teams_leaded[i].team_id,
          team_name: teams_leaded[i].team_name,
          team_members: teams_leaded[i].team_members.map((el: any) =>
            String(el.roll_number)
          ),
          team_leader: (teams_leaded[i].team_leader.name),
        });
      }

      const invitations = response.invitations;
      const modified_invitations = [];
      for (let i = 0; i < invitations.length; i++) {
        modified_invitations.push({
          request_id: invitations[i].request_id,
          teamName: invitations[i].team.team_name,
          team_id: invitations[i].team_id,
          team_leader: invitations[i].team.team_leader_id,
          request_time: invitations[i].request_time,
        });
      }

      setInvitations(modified_invitations);
      setTeams(modified_teams_leaded);
      setMemberTeams(modified_teams_member);
    }
    getData();
  }, [refresh]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setLoading(true);
      try {
        const createTeam = await fetch(`/api/teams/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_name: formData.name }),
        });

        if (!createTeam.ok) {
          const errorResponse = await createTeam.json();
          throw new Error(errorResponse.error || 'Failed to create team');
        }

        const response = await createTeam.json();
        let newTeam = response.data;
        newTeam = { ...newTeam, team_members: [] };

        setTeams([...teams, newTeam]);
        setIsCreateModalOpen(false);
        setFormData({ name: '' });
        setStatusModal({
          type: 'success',
          title: 'Team Created',
          message: 'The team has been created successfully.',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setStatusModal({
          type: 'error',
          title: 'Error',
          message: errorMessage || 'Failed to create team. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const confirmDeleteTeam = async (teamId: string) => {
    setTeamToDelete(teamId);
    setStatusModal({
      type: 'confirm',
      title: 'Delete Team',
      message:
        'Are you sure you want to delete this team? This action cannot be undone.',
    });
  };

  const deleteTeam = async () => {
    if (teamToDelete) {
      try {
        const delete_team = await DeleteTeam(teamToDelete);
        if (!delete_team?.success) {
          throw new Error(delete_team.message);
        }
        setTeams(teams.filter((team) => team.team_id !== teamToDelete));
        setStatusModal({
          type: 'success',
          title: 'Team Deleted',
          message: 'The team has been deleted successfully.',
        });
      } catch (err) {
        setStatusModal({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete team. Please try again.',
        });
      } finally {
        setTeamToDelete(null);
      }
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam && newMemberRoll.trim()) {
      setLoading(true);
      try {
        if (isNaN(Number(newMemberRoll.trim()))) {
          throw new Error('Roll Number should be a number');
        }

        const data = {
          team_id: selectedTeam.team_id,
          invitee_roll_number: newMemberRoll.trim(),
        };

        const invite = await fetch(`/api/invite-to-team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!invite.ok) {
          const errorMsg = await invite.json();
          throw new Error(errorMsg.error);
        }

        const response = await invite.json();

        setStatusModal({
          type: 'success',
          title: 'Request Sent',
          message: response.message || 'Invitation sent successfully.',
        });
      } catch (err) {
        setStatusModal({
          type: 'error',
          title: 'Error',
          message: String(err) || 'Failed to add member. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const acceptInvitation = async (req_id: string, joinTeam: boolean) => {
    try {
      const invite = await fetch(`/api/join-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: req_id, joinTeam: joinTeam }),
      });

      if (!invite.ok) {
        const errorMsg = await invite.json();
        throw new Error(errorMsg);
      }

      if (joinTeam) {
        setStatusModal({
          type: 'success',
          title: 'Invitation accepted',
          message: 'Team joined successfully.',
        });
      } else {
        setStatusModal({
          type: 'success',
          title: 'Invitation rejected',
          message: 'Invitation request deleted successfully.',
        });
      }
      set_refresh(!refresh);
    } catch (err) {
      setStatusModal({
        type: 'error',
        title: 'Error',
        message: String(err) || 'Failed to process request.',
      });
    }
  };

  const handleAddMemberClick = (team: Team) => {
    setSelectedTeam(team);
    setIsAddMemberModalOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const handleTeamClick = (team: Team) => {
  setSelectedTeam(team);
  setIsTeamDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams Leading Section */}
        <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="text-primary-cyan" size={24} />
              <h2 className="text-xl font-semibold text-white">
                Teams You Lead
              </h2>
            </div>
            <GradientButton
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create Team</span>
              </div>
            </GradientButton>
          </div>
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.team_id}
                onClick={() => handleTeamClick(team)}
                className="cursor-pointer bg-gray-900/50 p-4 rounded-lg border border-gray-800/30 
             hover:border-primary-blue/50 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-white text-lg">
                      {team.team_name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteTeam(team.team_id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button> */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddMemberClick(team);}}
                      className="text-primary-cyan hover:text-primary-blue text-sm bg-gray-900/50 px-3 py-1 rounded-md transition-colors"
                    >
                      Add Member
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex -space-x-2">
                    {team.team_members.slice(0, 3).map((member, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-blue to-primary-cyan border-2 border-gray-900 flex items-center justify-center text-xs text-white"
                      >
                        {member.slice(-2)}
                      </div>
                    ))}
                    {team.team_members.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-white">
                        +{team.team_members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teams Member Of Section */}
        <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="text-primary-cyan" size={24} />
            <h2 className="text-xl font-semibold text-white">
              Teams You're Part Of
            </h2>
          </div>
          <div className="space-y-4">
            {memberTeams.map((team) => (
              <div
                key={team.team_id}
                onClick={() => handleTeamClick(team)}
                className="cursor-pointer bg-gray-900/50 p-4 rounded-lg border border-gray-800/30 
             hover:border-primary-blue/50 transition-all duration-200"
              >
                <div className="mb-2">
                  <h3 className="font-medium text-white text-lg">
                    {team.team_name}
                  </h3>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex -space-x-2">
                    {team.team_members.slice(0, 3).map((member, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-blue to-primary-cyan border-2 border-gray-900 flex items-center justify-center text-xs text-white"
                      >
                        {member.slice(-2)}
                      </div>
                    ))}
                    {team.team_members.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-white">
                        +{team.team_members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Invitations Section */}
        <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Send className="text-primary-cyan" size={24} />
            <h2 className="text-xl font-semibold text-white">
              Team Invitations
            </h2>
          </div>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.request_id}
                className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/30 hover:border-primary-blue/50 transition-all duration-200"
              >
                <div className="mb-3">
                  <h3 className="font-medium text-white text-lg">
                    {invitation.teamName}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Invited by {invitation.team_leader}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    Sent {formatDate(invitation.request_time)}
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        acceptInvitation(invitation.request_id, true);
                      }}
                      className="bg-gradient-to-r from-primary-blue to-primary-cyan hover:from-primary-blue/90 hover:to-primary-cyan/90 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        acceptInvitation(invitation.request_id, false);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {invitations.length === 0 && (
              <p className="text-gray-400 text-sm">No pending invitations</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Team"
      >
        <form onSubmit={createTeam} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Team Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-black/30 border border-gray-700 rounded-lg
                       focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50
                       text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200"
              placeholder="Enter team name"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <GradientButton disabled={loading}>
              <div className="flex items-center space-x-2">
                {loading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <span>{loading ? 'Creating...' : 'Create Team'}</span>
              </div>
            </GradientButton>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setSelectedTeam(null);
        }}
        title={`Add Member to ${selectedTeam?.team_name}`}
      >
        <form onSubmit={addMember} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Roll Number
            </label>
            <input
              type="text"
              value={newMemberRoll}
              onChange={(e) => setNewMemberRoll(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-gray-700 rounded-lg
                       focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50
                       text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200"
              placeholder="Enter roll number"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setIsAddMemberModalOpen(false);
                setSelectedTeam(null);
              }}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <GradientButton disabled={loading}>
              <div className="flex items-center space-x-2">
                {loading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                <span>{loading ? 'Adding...' : 'Add Member'}</span>
              </div>
            </GradientButton>
          </div>
        </form>
      </Modal>

      {/* Team Details Modal */}
      <Modal
  isOpen={isTeamDetailsOpen}
  onClose={() => {
    setIsTeamDetailsOpen(false);
    setSelectedTeam(null);
  }}
  title="Team Details"
>
  {selectedTeam && (
    <div className="space-y-6">
      {/* Team Name */}
      <div>
        <h3 className="text-lg font-semibold text-white">
          {selectedTeam.team_name}
        </h3>
      </div>

      {/* Team Leader */}
      <div>
        <p className="text-sm text-gray-400 mb-1">Team Leader</p>
        <div className="px-4 py-2 rounded-lg bg-gray-900/60 text-white">
          {selectedTeam.team_leader}
        </div>
      </div>

      {/* Team Members */}
      <div>
        <p className="text-sm text-gray-400 mb-2">Team Members</p>

        {selectedTeam.team_members.length === 0 ? (
          <p className="text-gray-500 text-sm">No members yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {selectedTeam.team_members.map((member, idx) => (
              <div
                key={idx}
                className="px-4 py-2 rounded-lg bg-gray-900/60 text-white text-sm"
              >
                Roll No: {member}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}
</Modal>


      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal !== null}
        onClose={() => setStatusModal(null)}
        title={statusModal?.title || ''}
        message={statusModal?.message || ''}
        type={statusModal?.type || 'success'}
        onConfirm={statusModal?.type === 'confirm' ? deleteTeam : undefined}
      />
    </div>
  );
};

export default TeamDashboard;
