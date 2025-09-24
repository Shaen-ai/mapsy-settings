import { FiEdit2, FiTrash2, FiPhone, FiMail, FiGlobe, FiMapPin } from 'react-icons/fi';
import { Location } from '../types/location';

interface LocationListProps {
  locations: Location[];
  onEdit: (location: Location) => void;
  onDelete: (id: string | number) => void;
}

const LocationList: React.FC<LocationListProps> = ({ locations, onEdit, onDelete }) => {
  if (locations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No locations added yet. Click "Add New Location" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map((location) => {
        // Use MongoDB _id or regular id
        const locationId = (location as any)._id || location.id;
        return (
        <div key={locationId} className="bg-white rounded-lg shadow-md overflow-hidden">
          {location.image_url && (
            <img
              src={location.image_url}
              alt={location.name}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{location.name}</h3>
                <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {location.category}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(location)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit"
                >
                  <FiEdit2 size={18} />
                </button>
                <button
                  onClick={() => {
                    const id = (location as any)._id || location.id;
                    if (id) onDelete(id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FiMapPin size={16} />
                <span className="truncate">{location.address}</span>
              </div>

              {location.phone && (
                <div className="flex items-center gap-2">
                  <FiPhone size={16} />
                  <span>{location.phone}</span>
                </div>
              )}

              {location.email && (
                <div className="flex items-center gap-2">
                  <FiMail size={16} />
                  <span className="truncate">{location.email}</span>
                </div>
              )}

              {location.website && (
                <div className="flex items-center gap-2">
                  <FiGlobe size={16} />
                  <a
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {location.website}
                  </a>
                </div>
              )}
            </div>

            {location.business_hours && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Business Hours</h4>
                <div className="text-xs space-y-1">
                  {Object.entries(location.business_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize text-gray-600">{day}:</span>
                      <span className="text-gray-800">{hours || 'Closed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default LocationList;