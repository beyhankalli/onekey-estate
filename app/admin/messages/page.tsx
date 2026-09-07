"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Mail, Phone, Check, Trash2, CheckCircle2, AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMessages = async () => {
    setLoading(true);
    // GÜNCELLENDİ: 'messages' tablosunu çekiyoruz ve 'properties' tablosuyla birleştiriyoruz (hangi ilan olduğunu bulmak için)
    const { data, error } = await supabase
      .from("messages")
      .select("*, properties(title, property_ref)")
      .order("created_at", { ascending: false });
      
    if (data) setMessages(data);
    if (error) console.error("Error fetching messages:", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [supabase]);

  // GÜNCELLENDİ: status yerine 'is_read' boolean değerini kullanıyoruz
  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("messages").update({ is_read: true }).eq("id", id);
    if (!error) fetchMessages();
  };

  // GÜNCELLENDİ: contact_messages yerine 'messages' tablosundan siliyoruz
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message forever?")) return;
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (!error) fetchMessages();
  };

  if (loading) return <div className="text-gray-500">Loading messages...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Inbox & Messages</h1>
        <p className="text-gray-500 font-light mt-1">Manage inquiries sent from the property listings.</p>
        <p className="text-sm font-medium text-[#ae884e] mt-2">Forwarding to: info@onekey.co.uk</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden p-8">
        {messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
            <p>Your inbox is empty. No messages yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-6 rounded-2xl border transition-all ${
                  !msg.is_read 
                    ? 'bg-amber-50/40 border-amber-200 shadow-sm' 
                    : 'bg-gray-50/50 border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2.5">
                      {!msg.is_read ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" title="Unread Message" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" title="Read Message" />
                      )}

                      <span>{msg.sender_name}</span>

                      {!msg.is_read && (
                        <span className="bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          New
                        </span>
                      )}
                    </h3>

                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      {msg.sender_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" /> 
                          <a href={`mailto:${msg.sender_email}`} className="hover:text-[#ae884e]">{msg.sender_email}</a>
                        </span>
                      )}
                      {msg.sender_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" /> 
                          <a href={`tel:${msg.sender_phone}`} className="hover:text-[#ae884e]">{msg.sender_phone}</a>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!msg.is_read && (
                      <button 
                        onClick={() => markAsRead(msg.id)} 
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors flex items-center gap-1.5 shadow-sm"
                        title="Mark as Read"
                      >
                        <Check className="w-4 h-4 text-green-600" /> Mark as Read
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(msg.id)} 
                      className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm" 
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* YENİ: Hangi ilan için atıldığını gösteren zarif kutu */}
                {msg.properties && (
                  <div className="flex items-center gap-2 mb-3 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-700 shadow-sm">
                    <Home className="w-4 h-4 text-[#1c3053]" />
                    <span>
                      Regarding: <Link href={`/listings/${msg.property_id}`} target="_blank" className="font-semibold text-[#1c3053] hover:text-[#ae884e] transition-colors hover:underline">{msg.properties.title}</Link> 
                      <span className="text-gray-400 ml-1">(Ref: {msg.properties.property_ref})</span>
                    </span>
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-gray-100 text-gray-700 whitespace-pre-wrap font-light">
                  {msg.message}
                </div>

                <p className="text-xs text-gray-400 mt-4 text-right">
                  Received: {new Date(msg.created_at).toLocaleString('en-GB')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}