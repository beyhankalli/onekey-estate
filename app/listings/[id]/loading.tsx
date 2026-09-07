export default function PropertyDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-6" />
        <div className="bg-white rounded-[2rem] border border-gray-100 p-4 mb-10">
          <div className="h-[300px] md:h-[550px] bg-gray-200 rounded-2xl" />
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 space-y-5">
              <div className="h-10 w-3/4 bg-gray-200 rounded-xl" />
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="h-24 w-full bg-gray-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-72 bg-white rounded-[2rem] border border-gray-100" />
              <div className="h-72 bg-white rounded-[2rem] border border-gray-100" />
            </div>
          </div>
          <div className="w-full lg:w-96 h-96 bg-white rounded-[2rem] border border-gray-100" />
        </div>
      </div>
    </div>
  );
}
