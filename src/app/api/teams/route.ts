import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/actions/Sessions';
import prisma from '@/lib/PrismaClient/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ status: 400, message: 'User not logged in!' });
    }
    const userId = session.user.id;

    const teams_leaded = await prisma.team.findMany({
  where: { team_leader_id: userId },
  include: {
    team_leader: {
      select: {
        id: true,
        name: true,
        roll_number: true,
      },
    },
    team_members: {
      select: {
        id: true,
        name: true,
        roll_number: true,
      },
    },
  },
});

    const teams_member = await prisma.team.findMany({
      where: { team_members: { some: { id: userId } } },
      select: {
        team_name: true,
        team_id: true,
        team_members: {
          select: {
            roll_number: true,
          },
        },
        team_leader: {
          select: {
            roll_number: true,
          },
        },
      },
    });

    const invitations = await prisma.pending_requests.findMany({
      where: {
        user_id: userId,
      },
      select: {
        request_id: true,
        request_time: true,
        team_id: true,
        team: {
          select: {
            team_leader_id: true,
            team_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: 200,
      teams_leaded,
      teams_member,
      invitations,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ status: 500, message: 'Internal Server Error' });
  }
}
