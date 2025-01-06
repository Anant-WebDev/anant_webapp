import React from 'react'

const EventsHeader = () => {
  return (
    <div className="text-center mb-16">
      <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-blue via-primary-cyan to-primary-purple">
        Events
      </h1>
      <p className="text-gray-400 max-w-2xl mx-auto">
        Join our events and unlock your potential. Celebrate every achievement with us!
      </p>
      <div className="flex justify-center gap-4 mt-8">
        <button className="px-6 py-2 rounded-lg bg-primary-blue/10 text-primary-cyan border border-primary-blue/20 hover:bg-primary-blue/20 transition-all">
          Live Events
        </button>
        <button className="px-6 py-2 rounded-lg bg-primary-blue/10 text-primary-cyan border border-primary-blue/20 hover:bg-primary-blue/20 transition-all">
          Upcoming Events
        </button>
        <button className="px-6 py-2 rounded-lg bg-primary-blue/10 text-primary-cyan border border-primary-blue/20 hover:bg-primary-blue/20 transition-all">
          Past Events
        </button>
      </div>
    </div>
  )
}
export default EventsHeader