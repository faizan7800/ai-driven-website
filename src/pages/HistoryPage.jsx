import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Clock, Trash2, Car, ArrowRight } from 'lucide-react';

export default function HistoryPage() {
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      setLoading(true);
      // Fetch all vehicles from Firestore (each saved search is a document)
      const vehiclesRef = collection(db, 'vehicle');
      const snapshot = await getDocs(vehiclesRef);
      
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        plate: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        // Sort by timestamp if available
        const timeA = a.tireAnalysis?.timestamp || a.timestamp || 0;
        const timeB = b.tireAnalysis?.timestamp || b.timestamp || 0;
        return new Date(timeB) - new Date(timeA);
      });

      setSearchHistory(history);
      setError(null);
    } catch (err) {
      console.error('[v0] Error fetching history:', err);
      setError('Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (plate) => {
    if (window.confirm(`Delete search history for ${plate}?`)) {
      try {
        await deleteDoc(doc(db, 'vehicle', plate));
        setSearchHistory(searchHistory.filter(item => item.plate !== plate));
      } catch (err) {
        console.error('[v0] Error deleting history:', err);
        alert('Failed to delete history entry');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
          <Clock size={32} className="text-blue-600" />
          Search History
        </h1>
        <p className="text-slate-600">View all your previous vehicle searches</p>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-slate-600">Loading history...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!loading && searchHistory.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <Car size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 text-lg">No search history yet</p>
          <p className="text-slate-500 text-sm mt-2">Your search history will appear here when you save vehicle data</p>
        </div>
      )}

      {!loading && searchHistory.length > 0 && (
        <div className="space-y-4">
          {searchHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Car size={20} className="text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">{item.plate}</h3>
                    {item.apiData?.merke && item.apiData?.handelsbetegnelse && (
                      <>
                        <ArrowRight size={16} className="text-slate-400" />
                        <span className="text-slate-700 font-semibold">
                          {item.apiData.merke} {item.apiData.handelsbetegnelse}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {item.apiData?.year && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Year</p>
                        <p className="text-slate-800 font-semibold">{item.apiData.year}</p>
                      </div>
                    )}
                    {item.apiData?.color && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Color</p>
                        <p className="text-slate-800 font-semibold">{item.apiData.color}</p>
                      </div>
                    )}
                    {item.tireAnalysis?.timestamp && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Searched</p>
                        <p className="text-slate-800 font-semibold">{formatDate(item.tireAnalysis.timestamp)}</p>
                      </div>
                    )}
                  </div>

                  {item.manualData && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 uppercase mb-2">Additional Data</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {item.manualData.liens && (
                          <div className="bg-blue-50 px-2 py-1 rounded">Liens Info</div>
                        )}
                        {item.manualData.lease && (
                          <div className="bg-purple-50 px-2 py-1 rounded">Lease Info</div>
                        )}
                        {item.manualData.insurance && (
                          <div className="bg-green-50 px-2 py-1 rounded">Insurance</div>
                        )}
                        {item.manualData.maintenance && (
                          <div className="bg-amber-50 px-2 py-1 rounded">Maintenance</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteHistory(item.plate)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete this entry"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
