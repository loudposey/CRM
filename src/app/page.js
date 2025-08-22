import MeetingScheduler from '../components/MeetingScheduler.js';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Schedule a Meeting
            </h1>
            <p className="text-gray-600">
              Select a convenient time for your 30-minute meeting
            </p>
          </div>
          <MeetingScheduler />
        </div>
      </div>
    </div>
  );
}
