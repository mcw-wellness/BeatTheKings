'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';

export default function RegisterPage() {
  const router = useRouter();
  const { setUserProfile } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (parseInt(formData.age) < 13) newErrors.age = 'You must be at least 13 years old';
    if (!formData.gender) newErrors.gender = 'Please select a gender';
    if (!formData.location) newErrors.location = 'Location is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUserProfile(
      formData.name,
      parseInt(formData.age),
      formData.gender,
      formData.location
    );

    router.push('/photo');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="md" pulsing />
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Tell us a bit about yourself
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Input
            label="Age"
            type="number"
            placeholder="Your age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            error={errors.age}
            min="13"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
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

          <Input
            label="Location"
            type="text"
            placeholder="City, State"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={errors.location}
          />

          <Button type="submit" className="w-full mt-6">
            Start
          </Button>
        </form>
      </div>
    </main>
  );
}