'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';

interface State {
  id: string;
  name: string;
  nameGerman: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setUserProfile } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    state: '',
    city: '',
  });
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch states on mount
  useEffect(() => {
    fetch('/api/locations/states')
      .then(res => res.json())
      .then(data => setStates(data))
      .catch(err => console.error('Failed to fetch states:', err));
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.state) {
      fetch(`/api/locations/cities?state=${formData.state}`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error('Failed to fetch cities:', err));
    } else {
      setCities([]);
    }
  }, [formData.state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (parseInt(formData.age) < 13) newErrors.age = 'You must be at least 13 years old';
    if (!formData.gender) newErrors.gender = 'Please select a gender';
    if (!formData.state) newErrors.state = 'Please select a state';
    if (!formData.city) newErrors.city = 'Please select a city';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Combine city and state for location
    const location = `${formData.city}, ${formData.state}`;

    setUserProfile(
      formData.name,
      parseInt(formData.age),
      formData.gender,
      location
    );

    // Mark user as registered
    localStorage.setItem('user_registered', 'true');

    router.push('/photo');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-48 h-48">
            <Logo size="lg" pulsing />
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Age Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Age
            </label>
            <input
              type="number"
              placeholder="Your age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="13"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {errors.age && (
              <p className="text-sm text-red-600 mt-1">{errors.age}</p>
            )}
          </div>

          {/* Gender Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none bg-white"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-sm text-red-600 mt-1">{errors.gender}</p>
            )}
          </div>

          {/* State Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              State / Bundesland
            </label>
            <select
              value={formData.state}
              onChange={(e) => {
                setFormData({ ...formData, state: e.target.value, city: '' });
                setErrors({ ...errors, state: '', city: '' });
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none bg-white"
            >
              <option value="">Select state...</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name} ({state.nameGerman})
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-sm text-red-600 mt-1">{errors.state}</p>
            )}
          </div>

          {/* City Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              City
            </label>
            <select
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                setErrors({ ...errors, city: '' });
              }}
              disabled={!formData.state}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.state ? 'Select city...' : 'Select a state first'}
              </option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="text-sm text-red-600 mt-1">{errors.city}</p>
            )}
          </div>

          {/* Start Button */}
          <button
            type="submit"
            className="w-full bg-[#4361EE] hover:bg-[#3651DE] text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 mt-6"
          >
            Start
          </button>
        </form>
      </div>
    </main>
  );
}