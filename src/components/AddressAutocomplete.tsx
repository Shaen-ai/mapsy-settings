import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = '123 Main St, City, State ZIP',
  className = '',
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then(() => {
        console.log('Google Maps Places API loaded successfully');
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
        // If there's an error, we can still allow manual input
        setIsLoaded(false);
      });
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const input = inputRef.current;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(input, {
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      types: ['geocode'],
    });

    // Add place changed listener
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      console.log('🗺️ Place changed event fired, place:', place);

      if (place && place.formatted_address) {
        isSelectingRef.current = true;
        const fullAddress = place.formatted_address;
        console.log('✅ Selected address from autocomplete:', fullAddress);

        // Update internal value
        setInternalValue(fullAddress);

        // Update the input value directly
        if (inputRef.current) {
          inputRef.current.value = fullAddress;
        }

        // Update the parent state immediately
        console.log('📤 Calling onChange with:', fullAddress);
        onChange(fullAddress);

        if (onPlaceSelect) {
          onPlaceSelect(place);
        }

        setTimeout(() => {
          isSelectingRef.current = false;
        }, 100);
      } else {
        console.log('⚠️ No formatted_address in place object');
      }
    });

    // Create a MutationObserver to watch for value changes
    const observer = new MutationObserver(() => {
      const currentValue = input.value;
      if (currentValue !== internalValue && currentValue.length > 0) {
        console.log('🔮 MutationObserver detected value change to:', currentValue);
        setInternalValue(currentValue);
        onChange(currentValue);
      }
    });

    // Observe value attribute changes
    observer.observe(input, {
      attributes: true,
      attributeFilter: ['value'],
    });

    // Also watch for property changes (Google might change value property directly)
    let lastValue = input.value;
    const valueWatcher = setInterval(() => {
      if (input.value !== lastValue) {
        lastValue = input.value;
        if (input.value !== internalValue && input.value.length > 0) {
          console.log('⏰ Interval detected value change to:', input.value);
          setInternalValue(input.value);
          onChange(input.value);
        }
      }
    }, 100);

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      observer.disconnect();
      clearInterval(valueWatcher);
    };
  }, [isLoaded]); // Remove onChange and onPlaceSelect from dependencies to avoid re-creating

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('⌨️ Input changed to:', newValue);
    setInternalValue(newValue);

    // Delay updating parent to avoid conflicts with autocomplete
    if (!isSelectingRef.current) {
      // Use a timeout to ensure autocomplete selection takes priority
      setTimeout(() => {
        if (!isSelectingRef.current) {
          console.log('📤 Sending typed value to parent:', newValue);
          onChange(newValue);
        }
      }, 50);
    } else {
      console.log('🚫 Not updating parent - autocomplete is selecting');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Prevent form submission when selecting from autocomplete
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer && (pacContainer as HTMLElement).style.display !== 'none') {
        e.preventDefault();
        // Force trigger the first suggestion selection
        const firstResult = pacContainer.querySelector('.pac-item') as HTMLElement;
        if (firstResult) {
          console.log('🎯 Simulating click on first autocomplete result');
          firstResult.click();
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Let Google handle arrow keys
      console.log('⬆️⬇️ Arrow key pressed, letting Google handle it');
    }
  };

  // Add focus/blur handlers to track selection state
  const handleFocus = () => {
    console.log('🔍 Input focused');
  };

  const handleBlur = () => {
    console.log('👋 Input blurred');
    // After blur, ensure the value is synced
    setTimeout(() => {
      const currentValue = inputRef.current?.value || '';
      if (currentValue !== internalValue) {
        console.log('🔄 Syncing value after blur:', currentValue);
        setInternalValue(currentValue);
        onChange(currentValue);
      }
    }, 200);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default AddressAutocomplete;