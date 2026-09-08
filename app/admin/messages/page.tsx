"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Mail,
  Phone,
  Check,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Home,
  Archive,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  MailOpen,
  Plus,
  Send,
  X,
  User,
  UserRound,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Property {
  title: string;
  property_ref: string;
}

interface Thread {
  id: string;
  customer_id: string | null;
  property_id: string | null;
  subject: string | null;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  customer?: Customer | Customer[] | null;
  property?: Property | Property[] | null;
}

interface ConversationMessage {
  id: string;
  thread_id: string;
  sender_type: "customer" | "admin";
  sender_admin_user_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface LegacyMessage {
  id: string;
  sender_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  message: string | null;
  property_id: string | null;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  properties?: Property | Property[] | null;
}

function normalizeThread(data: any): Thread {
  const customer = Array.isArray(data?.customer)
    ? data.customer[0] ?? null
    : data?.customer ?? null;

  const property = Array.isArray(data?.property)
    ? data.property[0] ?? null
    : data?.property ?? null;

  return {
    id: String(data?.id ?? ""),
    customer_id: data?.customer_id ?? null,
    property_id: data?.property_id ?? null,
    subject: data?.subject ?? null,
    status: data?.status === "closed" ? "closed" : "open",
    created_at: String(data?.created_at ?? ""),
    updated_at: String(data?.updated_at ?? data?.created_at ?? ""),
    customer,
    property,
  };
}

function normalizeConversationMessage(
  data: any
): ConversationMessage {
  return {
    id: String(data?.id ?? ""),
    thread_id: String(data?.thread_id ?? ""),
    sender_type:
      data?.sender_type === "customer" ? "customer" : "admin",
    sender_admin_user_id: data?.sender_admin_user_id ?? null,
    message: String(data?.message ?? ""),
    is_read: Boolean(data?.is_read),
    created_at: String(data?.created_at ?? ""),
  };
}

function normalizeLegacyMessage(data: any): LegacyMessage {
  const properties = Array.isArray(data?.properties)
    ? data.properties[0] ?? null
    : data?.properties ?? null;

  return {
    id: String(data?.id ?? ""),
    sender_name: data?.sender_name ?? null,
    sender_email: data?.sender_email ?? null,
    sender_phone: data?.sender_phone ?? null,
    message: data?.message ?? null,
    property_id: data?.property_id ?? null,
    is_read: Boolean(data?.is_read),
    is_archived: Boolean(data?.is_archived),
    created_at: String(data?.created_at ?? ""),
    properties,
  };
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<LegacyMessage[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [conversationMessages, setConversationMessages] = useState<
    ConversationMessage[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "inbox" | "archived" | "conversations"
  >("inbox");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] =
    useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [selectedThread, setSelectedThread] =
    useState<Thread | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [closingThread, setClosingThread] = useState(false);
  const [loadingConversationMessages, setLoadingConversationMessages] =
    useState(false);

  const [newCustomerId, setNewCustomerId] = useState("");
  const [newSubject, setNewSubject] = useState("");

  const supabase = createClient();

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*, properties(title, property_ref)")
      .order("created_at", { ascending: sortOrder === "asc" });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages((data ?? []).map(normalizeLegacyMessage));
    }

    if (showLoading) {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, email, phone")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching customers:", error);
      return;
    }

    setCustomers(
      (data ?? []).map((customer) => ({
        id: String(customer.id),
        name: String(customer.name ?? ""),
        email: customer.email ?? null,
        phone: customer.phone ?? null,
      }))
    );
  };

  const fetchThreads = async (showLoading = true) => {
    if (showLoading) {
      setLoadingThreads(true);
    }

    const { data, error } = await supabase
      .from("customer_message_threads")
      .select(
        "id, customer_id, property_id, subject, status, created_at, updated_at, customer:customers(id, name, email, phone), property:properties(title, property_ref)"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching message threads:", error);
    } else {
      setThreads((data ?? []).map(normalizeThread));
    }

    if (showLoading) {
      setLoadingThreads(false);
    }
  };

  const fetchConversationMessages = async (
    threadId: string,
    showLoading = true
  ) => {
    if (showLoading) {
      setLoadingConversationMessages(true);
    }

    const { data, error } = await supabase
      .from("customer_messages")
      .select(
        "id, thread_id, sender_type, sender_admin_user_id, message, is_read, created_at"
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "Error fetching conversation messages:",
        error
      );

      if (showLoading) {
        setLoadingConversationMessages(false);
      }

      return;
    }

    setConversationMessages(
      (data ?? []).map(normalizeConversationMessage)
    );

    if (showLoading) {
      setLoadingConversationMessages(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchMessages(false),
        fetchThreads(false),
        fetchCustomers(),
      ]);

      if (selectedThread) {
        await fetchConversationMessages(selectedThread.id, false);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [sortOrder]);

  useEffect(() => {
    fetchThreads();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchConversationMessages(selectedThread.id);
    } else {
      setConversationMessages([]);
    }
  }, [selectedThread]);

  const toggleReadStatus = async (
    id: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating read status:", error);
      return;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? { ...msg, is_read: !currentStatus }
          : msg
      )
    );
  };

  const toggleArchiveStatus = async (
    id: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_archived: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating archive status:", error);
      return;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? { ...msg, is_archived: !currentStatus }
          : msg
      )
    );
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this message forever? This cannot be undone."
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Unable to delete message: " + error.message);
      return;
    }

    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const createConversation = async () => {
    if (!newCustomerId) {
      alert("Please select a customer.");
      return;
    }

    setCreatingThread(true);

    try {
      const { data, error } = await supabase
        .from("customer_message_threads")
        .insert({
          customer_id: newCustomerId,
          subject: newSubject.trim() || null,
          status: "open",
        })
        .select(
          "id, customer_id, property_id, subject, status, created_at, updated_at, customer:customers(id, name, email, phone), property:properties(title, property_ref)"
        )
        .single();

      if (error) {
        alert(
          "Unable to create conversation: " + error.message
        );
        return;
      }

      if (!data) {
        alert("Unable to create conversation.");
        return;
      }

      const newThread = normalizeThread(data);

      setThreads((prev) => [newThread, ...prev]);
      setSelectedThread(newThread);
      setNewCustomerId("");
      setNewSubject("");
    } finally {
      setCreatingThread(false);
    }
  };

  const sendConversationMessage = async () => {
    if (!selectedThread || !messageText.trim()) {
      return;
    }

    if (selectedThread.status === "closed") {
      return;
    }

    setSendingMessage(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Your admin session has expired. Please log in again."
        );
        return;
      }

      const trimmedMessage = messageText.trim();

      const { data, error } = await supabase
        .from("customer_messages")
        .insert({
          thread_id: selectedThread.id,
          sender_type: "admin",
          sender_admin_user_id: user.id,
          message: trimmedMessage,
          is_read: true,
        })
        .select(
          "id, thread_id, sender_type, sender_admin_user_id, message, is_read, created_at"
        )
        .single();

      if (error) {
        alert("Unable to send message: " + error.message);
        return;
      }

      if (data) {
        setConversationMessages((prev) => [
          ...prev,
          normalizeConversationMessage(data),
        ]);
      }

      const now = new Date().toISOString();

      const { error: threadUpdateError } = await supabase
        .from("customer_message_threads")
        .update({
          updated_at: now,
        })
        .eq("id", selectedThread.id);

      if (threadUpdateError) {
        console.error(
          "Unable to update conversation timestamp:",
          threadUpdateError
        );
      }

      setThreads((prev) =>
        prev
          .map((thread) =>
            thread.id === selectedThread.id
              ? { ...thread, updated_at: now }
              : thread
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
      );

      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              updated_at: now,
            }
          : prev
      );

      setMessageText("");
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleThreadStatus = async () => {
    if (!selectedThread) {
      return;
    }

    const newStatus: "open" | "closed" =
      selectedThread.status === "open" ? "closed" : "open";

    setClosingThread(true);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("customer_message_threads")
        .update({
          status: newStatus,
          updated_at: now,
        })
        .eq("id", selectedThread.id);

      if (error) {
        alert(
          "Unable to update conversation: " + error.message
        );
        return;
      }

      const updatedThread: Thread = {
        ...selectedThread,
        status: newStatus,
        updated_at: now,
      };

      setSelectedThread(updatedThread);

      setThreads((prev) =>
        prev
          .map((thread) =>
            thread.id === selectedThread.id
              ? updatedThread
              : thread
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
      );
    } finally {
      setClosingThread(false);
    }
  };

  const markCustomerMessagesAsRead = async (
    threadId: string
  ) => {
    const unreadMessages = conversationMessages.filter(
      (message) =>
        message.thread_id === threadId &&
        message.sender_type === "customer" &&
        !message.is_read
    );

    if (unreadMessages.length === 0) {
      return;
    }

    const { error } = await supabase
      .from("customer_messages")
      .update({ is_read: true })
      .eq("thread_id", threadId)
      .eq("sender_type", "customer")
      .eq("is_read", false);

    if (error) {
      console.error(
        "Unable to mark customer messages as read:",
        error
      );
      return;
    }

    setConversationMessages((prev) =>
      prev.map((message) =>
        message.thread_id === threadId &&
        message.sender_type === "customer"
          ? { ...message, is_read: true }
          : message
      )
    );
  };

  useEffect(() => {
    if (
      selectedThread &&
      conversationMessages.length > 0 &&
      activeTab === "conversations"
    ) {
      markCustomerMessagesAsRead(selectedThread.id);
    }
  }, [
    selectedThread,
    conversationMessages.length,
    activeTab,
  ]);

  const filteredMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return messages.filter((msg) => {
      const matchesTab =
        activeTab === "inbox"
          ? !msg.is_archived
          : msg.is_archived;

      const safeName = msg.sender_name || "";
      const safeEmail = msg.sender_email || "";
      const safePhone = msg.sender_phone || "";
      const safeContent = msg.message || "";

      const matchesSearch =
        !query ||
        safeName.toLowerCase().includes(query) ||
        safeEmail.toLowerCase().includes(query) ||
        safePhone.toLowerCase().includes(query) ||
        safeContent.toLowerCase().includes(query);

      const matchesProperty =
        selectedProperty === "all" ||
        msg.property_id === selectedProperty;

      return matchesTab && matchesSearch && matchesProperty;
    });
  }, [
    messages,
    activeTab,
    searchTerm,
    selectedProperty,
  ]);

  const filteredThreads = useMemo(() => {
    const query = threadSearch.trim().toLowerCase();

    if (!query) {
      return threads;
    }

    return threads.filter((thread) => {
      const customer = Array.isArray(thread.customer)
        ? thread.customer[0]
        : thread.customer;

      const property = Array.isArray(thread.property)
        ? thread.property[0]
        : thread.property;

      return (
        customer?.name?.toLowerCase().includes(query) ||
        customer?.email?.toLowerCase().includes(query) ||
        customer?.phone?.toLowerCase().includes(query) ||
        thread.subject?.toLowerCase().includes(query) ||
        property?.title?.toLowerCase().includes(query) ||
        property?.property_ref?.toLowerCase().includes(query)
      );
    });
  }, [threads, threadSearch]);

  const uniqueProperties = useMemo(() => {
    const map = new Map<string, Property>();

    messages.forEach((message) => {
      if (!message.property_id || !message.properties) {
        return;
      }

      const property = Array.isArray(message.properties)
        ? message.properties[0]
        : message.properties;

      if (property) {
        map.set(message.property_id, property);
      }
    });

    return Array.from(map.entries());
  }, [messages]);

  const unreadLegacyCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          !message.is_archived && !message.is_read
      ).length,
    [messages]
  );

  const openThreadCount = useMemo(
    () =>
      threads.filter((thread) => thread.status === "open").length,
    [threads]
  );

  const getCustomer = (thread: Thread) =>
    Array.isArray(thread.customer)
      ? thread.customer[0]
      : thread.customer;

  const getProperty = (thread: Thread) =>
    Array.isArray(thread.property)
      ? thread.property[0]
      : thread.property;

  const selectedCustomer = selectedThread
    ? getCustomer(selectedThread)
    : null;

  const selectedPropertyDetails = selectedThread
    ? getProperty(selectedThread)
    : null;

  return (
    <div className="max-w-7xl mx-auto pb-12 p-4 sm:p-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Inbox & Messages
          </h1>

          <p className="text-gray-500 font-light mt-1">
            Manage customer inquiries and agency conversations.
          </p>

          <p className="text-sm font-medium text-[#ae884e] mt-2 flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            Forwarding to: info@onekey.co.uk
          </p>
        </div>

        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 shrink-0"
          title="Refresh messages and conversations"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Unread Inbox
          </p>

          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {unreadLegacyCount}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Conversations
          </p>

          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {threads.length}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Open Conversations
          </p>

          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {openThreadCount}
          </p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`pb-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "inbox"
              ? "border-[#ae884e] text-[#1c3053]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <MailOpen className="w-4 h-4" />
          Inbox ({messages.filter((m) => !m.is_archived).length})
        </button>

        <button
          onClick={() => setActiveTab("archived")}
          className={`pb-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "archived"
              ? "border-[#ae884e] text-[#1c3053]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Archive className="w-4 h-4" />
          Archived ({messages.filter((m) => m.is_archived).length})
        </button>

        <button
          onClick={() => setActiveTab("conversations")}
          className={`pb-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "conversations"
              ? "border-[#ae884e] text-[#1c3053]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Customer Conversations ({threads.length})
        </button>
      </div>

      {activeTab !== "conversations" && (
        <>
          <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

              <input
                type="text"
                placeholder="Search by name, email, phone or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />

                <select
                  value={selectedProperty}
                  onChange={(e) =>
                    setSelectedProperty(e.target.value)
                  }
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 bg-white"
                >
                  <option value="all">All Properties</option>

                  {uniqueProperties.map(([id, property]) => (
                    <option key={id} value={id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  setSortOrder(
                    sortOrder === "desc" ? "asc" : "desc"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors shrink-0"
                title="Sort by Date"
              >
                <ArrowUpDown className="w-4 h-4" />

                <span className="hidden sm:inline">
                  {sortOrder === "desc" ? "Newest" : "Oldest"}
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
                >
                  <div className="h-5 bg-gray-100 rounded w-48" />
                  <div className="h-4 bg-gray-100 rounded w-72 mt-3" />
                  <div className="h-20 bg-gray-100 rounded-xl mt-5" />
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center text-gray-500 flex flex-col items-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
              <p>No messages found in this section.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMessages.map((msg) => {
                const property = Array.isArray(msg.properties)
                  ? msg.properties[0]
                  : msg.properties;

                return (
                  <div
                    key={msg.id}
                    className={`p-6 rounded-2xl border transition-all ${
                      !msg.is_read && activeTab === "inbox"
                        ? "bg-amber-50/40 border-amber-200 shadow-sm"
                        : "bg-white border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2.5">
                          {!msg.is_read ? (
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          )}

                          <span>
                            {msg.sender_name || "Unknown Sender"}
                          </span>

                          {!msg.is_read && (
                            <span className="bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              New
                            </span>
                          )}
                        </h3>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          {msg.sender_email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4 text-gray-400" />

                              <a
                                href={`mailto:${msg.sender_email}`}
                                className="hover:text-[#ae884e] transition-colors"
                              >
                                {msg.sender_email}
                              </a>
                            </span>
                          )}

                          {msg.sender_phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-4 h-4 text-gray-400" />

                              <a
                                href={`tel:${msg.sender_phone}`}
                                className="hover:text-[#ae884e] transition-colors"
                              >
                                {msg.sender_phone}
                              </a>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                          onClick={() =>
                            toggleReadStatus(
                              msg.id,
                              msg.is_read
                            )
                          }
                          className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                          title={
                            msg.is_read
                              ? "Mark as Unread"
                              : "Mark as Read"
                          }
                        >
                          {msg.is_read ? (
                            <Mail className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            toggleArchiveStatus(
                              msg.id,
                              msg.is_archived
                            )
                          }
                          className={`p-2 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm ${
                            msg.is_archived
                              ? "text-green-600 hover:bg-green-50"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                          title={
                            msg.is_archived
                              ? "Restore to Inbox"
                              : "Archive Message"
                          }
                        >
                          {msg.is_archived ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {property && (
                      <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700">
                        <Home className="w-4 h-4 text-[#1c3053]" />

                        <span>
                          Regarding:{" "}
                          {msg.property_id ? (
                            <Link
                              href={`/listings/${msg.property_id}`}
                              target="_blank"
                              className="font-semibold text-[#1c3053] hover:text-[#ae884e] transition-colors hover:underline"
                            >
                              {property.title}
                            </Link>
                          ) : (
                            <span className="font-semibold text-[#1c3053]">
                              {property.title}
                            </span>
                          )}

                          <span className="text-gray-400 ml-1">
                            (Ref: {property.property_ref})
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="bg-white p-5 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap font-light text-sm md:text-base leading-relaxed">
                      {msg.message || "No message content."}
                    </div>

                    <p className="text-xs text-gray-400 mt-4 text-right">
                      Received:{" "}
                      {msg.created_at
                        ? new Date(
                            msg.created_at
                          ).toLocaleString("en-GB")
                        : "Unknown"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "conversations" && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={() => {
                  setSelectedThread(null);
                  setNewCustomerId("");
                  setNewSubject("");
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c3053] hover:bg-[#ae884e] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </button>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  value={threadSearch}
                  onChange={(e) =>
                    setThreadSearch(e.target.value)
                  }
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                />
              </div>
            </div>

            <div className="max-h-[650px] overflow-y-auto">
              {loadingThreads ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-20 bg-gray-50 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No conversations found.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const customer = getCustomer(thread);
                  const property = getProperty(thread);

                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full text-left p-4 border-b border-gray-100 transition-colors ${
                        selectedThread?.id === thread.id
                          ? "bg-[#1c3053]/5 border-l-4 border-l-[#ae884e]"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {customer?.name ||
                              "Unknown Customer"}
                          </p>

                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {thread.subject ||
                              "General enquiry"}
                          </p>

                          {property && (
                            <p className="text-[11px] text-gray-400 truncate mt-1">
                              {property.title}
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            thread.status === "open"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {thread.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-2">
                        {thread.updated_at
                          ? new Date(
                              thread.updated_at
                            ).toLocaleString("en-GB")
                          : "Unknown"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden min-h-[650px] flex flex-col">
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                  <div className="text-center mb-6">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />

                    <h2 className="text-xl font-semibold text-gray-900">
                      Start a Customer Conversation
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Select a customer and create a conversation
                      thread.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Customer
                      </label>

                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                        <select
                          value={newCustomerId}
                          onChange={(e) =>
                            setNewCustomerId(e.target.value)
                          }
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                        >
                          <option value="">
                            Select customer...
                          </option>

                          {customers.map((customer) => (
                            <option
                              key={customer.id}
                              value={customer.id}
                            >
                              {customer.name}
                              {customer.email
                                ? ` — ${customer.email}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Subject
                      </label>

                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) =>
                          setNewSubject(e.target.value)
                        }
                        placeholder="e.g. Viewing follow-up"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                      />
                    </div>

                    <button
                      onClick={createConversation}
                      disabled={
                        creatingThread || customers.length === 0
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c3053] hover:bg-[#ae884e] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {creatingThread ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Conversation
                        </>
                      )}
                    </button>

                    {customers.length === 0 && (
                      <p className="text-xs text-gray-400 text-center">
                        No customers are currently available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-5 h-5 text-[#1c3053] shrink-0" />

                      <h2 className="font-semibold text-gray-900 truncate">
                        {selectedCustomer?.name ||
                          "Unknown Customer"}
                      </h2>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          selectedThread.status === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {selectedThread.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      {selectedCustomer?.email && (
                        <a
                          href={`mailto:${selectedCustomer.email}`}
                          className="flex items-center gap-1 hover:text-[#ae884e]"
                        >
                          <Mail className="w-3 h-3" />
                          {selectedCustomer.email}
                        </a>
                      )}

                      {selectedCustomer?.phone && (
                        <a
                          href={`tel:${selectedCustomer.phone}`}
                          className="flex items-center gap-1 hover:text-[#ae884e]"
                        >
                          <Phone className="w-3 h-3" />
                          {selectedCustomer.phone}
                        </a>
                      )}
                    </div>

                    {selectedPropertyDetails && (
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedPropertyDetails.title}
                        {selectedPropertyDetails.property_ref
                          ? ` · Ref: ${selectedPropertyDetails.property_ref}`
                          : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={toggleThreadStatus}
                      disabled={closingThread}
                      className={`p-2 rounded-xl border transition-colors ${
                        selectedThread.status === "open"
                          ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                      } disabled:opacity-50`}
                      title={
                        selectedThread.status === "open"
                          ? "Close Conversation"
                          : "Reopen Conversation"
                      }
                    >
                      {closingThread ? (
                        <span className="block w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                      ) : selectedThread.status === "open" ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedThread(null)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50">
                  {loadingConversationMessages ? (
                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <div className="h-16 w-3/5 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                      </div>

                      <div className="flex justify-end">
                        <div className="h-20 w-3/5 bg-[#1c3053]/20 rounded-2xl animate-pulse" />
                      </div>

                      <div className="flex justify-start">
                        <div className="h-16 w-2/5 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                      </div>
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center">
                      No messages in this conversation yet.
                    </div>
                  ) : (
                    conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_type === "admin"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.sender_type === "admin"
                              ? "bg-[#1c3053] text-white rounded-br-md"
                              : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.message}
                          </p>

                          <p
                            className={`text-[10px] mt-2 ${
                              message.sender_type === "admin"
                                ? "text-white/60"
                                : "text-gray-400"
                            }`}
                          >
                            {message.sender_type === "admin"
                              ? "Admin"
                              : "Customer"}{" "}
                            ·{" "}
                            {message.created_at
                              ? new Date(
                                  message.created_at
                                ).toLocaleString("en-GB")
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-3">
                    <textarea
                      value={messageText}
                      onChange={(e) =>
                        setMessageText(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey
                        ) {
                          e.preventDefault();
                          sendConversationMessage();
                        }
                      }}
                      disabled={
                        sendingMessage ||
                        selectedThread.status === "closed"
                      }
                      rows={3}
                      placeholder={
                        selectedThread.status === "closed"
                          ? "Conversation is closed."
                          : "Write a message... Press Enter to send."
                      }
                      className="flex-1 resize-none px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] disabled:bg-gray-50"
                    />

                    <button
                      onClick={sendConversationMessage}
                      disabled={
                        sendingMessage ||
                        !messageText.trim() ||
                        selectedThread.status === "closed"
                      }
                      className="self-end p-3 bg-[#1c3053] hover:bg-[#ae884e] text-white rounded-xl transition-colors disabled:opacity-40"
                      title="Send Message"
                    >
                      {sendingMessage ? (
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-2">
                    <p className="text-[11px] text-gray-400">
                      Customer communication is stored in the
                      conversation history. External email delivery
                      will be connected to the company email system
                      later.
                    </p>

                    <span className="text-[11px] text-gray-300 shrink-0 hidden sm:block">
                      Shift + Enter for new line
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}