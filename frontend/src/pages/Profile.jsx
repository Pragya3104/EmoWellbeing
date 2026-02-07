import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Load user details safely
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Show loading if user is not available yet
  if (!user) {
    return (
      <div className="text-center mt-20 text-xl font-semibold">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>

      <div className="flex items-center gap-4 mb-6">
        <img
          src={`https://ui-avatars.com/api/?name=${name}&background=6b21a8&color=fff&rounded=true&size=64`}
          className="w-16 h-16"
          alt="avatar"
        />
        <div>
          <p className="text-xl font-semibold">{name}</p>
          <p className="text-gray-500">{email}</p>
        </div>
      </div>

      <label className="block font-medium">Full Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border px-3 py-2 rounded mt-2"
      />

      <button className="mt-4 w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800">
        Save Changes
      </button>
    </div>
  );
}
