"use client";

import { useState } from "react";
import { Settings, Save, Shield, Bell, Building } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    agencyName: "OneKey Estate Agency",
    email: "admin@onekey.co.uk",
    phone: "+44 20 7946 0921",
    notificationsEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Settings updated successfully!");
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure agency profile and platform preferences.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name</label>
            <input
              type="text"
              value={settings.agencyName}
              onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Contact Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agency Phone</label>
          <input
            type="text"
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Email Notifications</p>
            <p className="text-xs text-gray-500">Receive instant alerts for new bookings and customer documents.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
            className="w-4 h-4 text-[#1c3053] focus:ring-[#ae884e] border-gray-300 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full bg-[#1c3053] hover:bg-[#ae884e] text-white py-3 rounded-xl font-medium transition-colors shadow-sm disabled:bg-gray-400"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving Changes..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}