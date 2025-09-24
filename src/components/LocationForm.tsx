import { useForm, Controller } from 'react-hook-form';
import { Location } from '../types/location';
import { useState, useEffect } from 'react';
import AddressAutocomplete from './AddressAutocomplete';

interface LocationFormProps {
  location?: Location | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ location, onSubmit, onCancel }) => {
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<Location>({
    defaultValues: location || {
      category: 'store',
      business_hours: {
        mon: '9:00 AM - 5:00 PM',
        tue: '9:00 AM - 5:00 PM',
        wed: '9:00 AM - 5:00 PM',
        thu: '9:00 AM - 5:00 PM',
        fri: '9:00 AM - 5:00 PM',
        sat: 'Closed',
        sun: 'Closed',
      },
    },
  });

  // Watch all form fields
  const watchedFields = watch();

  // Log changes to form data
  useEffect(() => {
    console.log('📝 Form data changed:', watchedFields);
    console.log('📍 Address field value:', watchedFields.address);
  }, [watchedFields]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(location?.image_url || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = (data: Location) => {
    console.log('🚀 Form submitted with data:', data);
    console.log('📍 Address being submitted:', data.address);

    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('address', data.address);
    if (data.phone) formData.append('phone', data.phone);
    if (data.email) formData.append('email', data.email);
    if (data.website) formData.append('website', data.website);
    formData.append('category', data.category);

    if (data.business_hours) {
      Object.entries(data.business_hours).forEach(([day, hours]) => {
        if (hours) formData.append(`business_hours[${day}]`, hours);
      });
    }

    if (imageFile) {
      formData.append('image', imageFile);
    }

    onSubmit(formData);
  };

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels: Record<string, string> = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Business Name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...register('category')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="restaurant">Restaurant</option>
            <option value="store">Store</option>
            <option value="office">Office</option>
            <option value="service">Service</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <Controller
          name="address"
          control={control}
          rules={{ required: 'Address is required' }}
          render={({ field }) => (
            <AddressAutocomplete
              value={field.value || ''}
              onChange={(value) => {
                field.onChange(value);
                setValue('address', value, { shouldValidate: true });
              }}
              placeholder="Start typing an address..."
              error={errors.address?.message}
              onPlaceSelect={(place) => {
                // Force update the form value when place is selected
                if (place.formatted_address) {
                  setValue('address', place.formatted_address, { shouldValidate: true });
                }
                // Also store coordinates if available
                if (place.geometry?.location) {
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();
                  console.log('📍 Coordinates from place:', { lat, lng });
                  // Store these in hidden form fields or state if needed
                }
                console.log('Place selected:', place);
              }}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            {...register('phone')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            {...register('email', {
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address',
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contact@business.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            {...register('website', {
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Must start with http:// or https://',
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Hours
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {days.map((day) => (
            <div key={day} className="flex items-center gap-2">
              <label className="w-20 text-sm text-gray-600">
                {dayLabels[day]}:
              </label>
              <input
                {...register(`business_hours.${day}` as any)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="9:00 AM - 5:00 PM or Closed"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-4 w-full max-w-xs h-40 object-cover rounded-lg"
          />
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {location ? 'Update' : 'Create'} Location
        </button>
      </div>
    </form>
  );
};

export default LocationForm;