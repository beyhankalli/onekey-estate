"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageCircle,
  Search,
  Send,
  User,
  Phone,
  Building2,
  Clock,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  lead_status: string | null;
  lead_priority: string | null;
  assigned_agent_id: string | null;
};

type Agent = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
};

type Property = {
  id: string;
  title: string;
  property_ref: string | null;
  monthly_rent: number | null;
};

type WhatsAppLog = {
  id: string;
  customer_id: string | null;
  phone_number: string;
  message: string;
  template_key: string | null;
  status: string;
  created_at: string;
};

const templates = [
  {
    key: "general",
    name: "General Enquiry",
    message:
      "Hi {customer}, this is OneKey Estate Agency. I’m getting in touch regarding your property enquiry. Please let me know if you have any questions.",
  },
  {
    key: "viewing_follow_up",
    name: "Viewing Follow-up",
    message:
      "Hi {customer}, this is OneKey Estate Agency. I’m following up regarding your property viewing. Please let me know if you would like any further information.",
  },
  {
    key: "property_enquiry",
    name: "Property Enquiry",
    message:
      "Hi {customer}, thank you for your interest in {property}. I’m contacting you from OneKey Estate Agency regarding the property. Please let me know if you would like more information or would like to arrange a viewing.",
  },
  {
    key: "application_follow_up",
    name: "Application Follow-up",
    message:
      "Hi {customer}, this is OneKey Estate Agency. I’m following up regarding your application. Please let me know if you need any assistance or if there is anything else we can help you with.",
  },
  {
    key: "offer_follow_up",
    name: "Offer Follow-up",
    message:
      "Hi {customer}, this is OneKey Estate Agency. I’m following up regarding your offer. Please let me know if you have any questions or need any further information.",
  },
];

function normalizePhone(phone: string) {
  let value = phone.replace(/[^\d+]/g, "");

  if (value.startsWith("+")) {
    value = value.slice(1);
  }

  if (value.startsWith("00")) {
    value = value.slice(2);
  }

  if (value.startsWith("07")) {
    value = `44${value.slice(1)}`;
  }

  if (value.startsWith("7") && value.length === 10) {
    value = `44${value}`;
  }

  return value;
}

export default function AdminWhatsAppPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("general");
  const [message, setMessage] = useState("");

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === selectedCustomerId
      ) || null,
    [customers, selectedCustomerId]
  );

  const selectedProperty = useMemo(
    () =>
      properties.find(
        (property) => property.id === selectedPropertyId
      ) || null,
    [properties, selectedPropertyId]
  );

  const selectedAgent = useMemo(
    () =>
      agents.find((agent) => agent.id === selectedAgentId) || null,
    [agents, selectedAgentId]
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.lead_status,
        customer.lead_priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        customersResult,
        agentsResult,
        propertiesResult,
        logsResult,
      ] = await Promise.all([
        supabase
          .from("customers")
          .select(
            "id, name, email, phone, lead_status, lead_priority, assigned_agent_id"
          )
          .not("phone", "is", null)
          .order("created_at", { ascending: false }),

        supabase
          .from("agents")
          .select("id, name, phone, whatsapp")
          .order("name"),

        supabase
          .from("properties")
          .select(
            "id, title, property_ref, monthly_rent"
          )
          .order("title"),

        supabase
          .from("whatsapp_message_logs")
          .select(
            "id, customer_id, phone_number, message, template_key, status, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      if (customersResult.error) throw customersResult.error;
      if (agentsResult.error) throw agentsResult.error;
      if (propertiesResult.error) throw propertiesResult.error;
      if (logsResult.error) throw logsResult.error;

      setCustomers((customersResult.data || []) as Customer[]);
      setAgents((agentsResult.data || []) as Agent[]);
      setProperties((propertiesResult.data || []) as Property[]);
      setLogs((logsResult.data || []) as WhatsAppLog[]);

      if (!selectedAgentId && agentsResult.data?.length) {
        setSelectedAgentId(agentsResult.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load WhatsApp data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const template = templates.find(
      (item) => item.key === selectedTemplate
    );

    if (!template) return;

    const customerName =
      selectedCustomer?.name || "there";

    const propertyName =
      selectedProperty?.title || "the property";

    const agentName =
      selectedAgent?.name || "OneKey Estate Agency";

    setMessage(
      template.message
        .replaceAll("{customer}", customerName)
        .replaceAll("{property}", propertyName)
        .replaceAll("{agent}", agentName)
    );
  }, [
    selectedTemplate,
    selectedCustomer,
    selectedProperty,
    selectedAgent,
  ]);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);

    if (customer.assigned_agent_id) {
      setSelectedAgentId(customer.assigned_agent_id);
    }
  };

  const openWhatsApp = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer.");
      return;
    }

    if (!selectedCustomer.phone) {
      alert("This customer does not have a phone number.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }

    const phone = normalizePhone(selectedCustomer.phone);

    if (phone.length < 8) {
      alert("The customer's phone number is not valid.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        "/api/admin/whatsapp/log",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: selectedCustomer.id,
            agentId: selectedAgentId || null,
            propertyId: selectedPropertyId || null,
            phoneNumber: selectedCustomer.phone,
            message: message.trim(),
            templateKey: selectedTemplate,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to prepare WhatsApp conversation."
        );
      }

      window.open(
        result.whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (result.log) {
        setLogs((current) => [
          result.log,
          ...current,
        ]);
      }
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to open WhatsApp."
      );
    } finally {
      setSending(false);
    }
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-7 h-7 text-[#1c3053] animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">
            Loading WhatsApp integration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          WhatsApp Integration
        </h1>

        <p className="text-gray-500 mt-1">
          Contact customers and leads directly through WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  New WhatsApp Conversation
                </h2>

                <p className="text-xs text-gray-500 mt-0.5">
                  Choose a customer and prepare the message.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search name, email or phone..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl">
              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No customers with phone numbers found.
                </div>
              ) : (
                filteredCustomers.map((customer) => {
                  const active =
                    customer.id === selectedCustomerId;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() =>
                        selectCustomer(customer)
                      }
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors ${
                        active
                          ? "bg-[#1c3053] text-white"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={`font-medium text-sm truncate ${
                              active
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {customer.name ||
                              "Unnamed customer"}
                          </p>

                          <p
                            className={`text-xs mt-0.5 ${
                              active
                                ? "text-gray-300"
                                : "text-gray-500"
                            }`}
                          >
                            {customer.phone}
                          </p>
                        </div>

                        {active && (
                          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {selectedCustomer && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {selectedCustomer.name ||
                        "Unnamed customer"}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {selectedCustomer.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedCustomer.phone}
                        </span>
                      )}

                      {selectedCustomer.lead_status && (
                        <span className="text-xs text-gray-500">
                          {selectedCustomer.lead_status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent
                </label>

                <select
                  value={selectedAgentId}
                  onChange={(event) =>
                    setSelectedAgentId(event.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
                >
                  <option value="">Select agent</option>

                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property
                </label>

                <select
                  value={selectedPropertyId}
                  onChange={(event) =>
                    setSelectedPropertyId(event.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
                >
                  <option value="">
                    No property selected
                  </option>

                  {properties.map((property) => (
                    <option
                      key={property.id}
                      value={property.id}
                    >
                      {property.title}
                      {property.property_ref
                        ? ` (${property.property_ref})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>

              <select
                value={selectedTemplate}
                onChange={(event) =>
                  setSelectedTemplate(event.target.value)
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
              >
                {templates.map((template) => (
                  <option
                    key={template.key}
                    value={template.key}
                  >
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>

                <span className="text-[11px] text-gray-400">
                  {message.length} characters
                </span>
              </div>

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                rows={7}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
              />
            </div>

            <button
              type="button"
              onClick={openWhatsApp}
              disabled={
                sending ||
                !selectedCustomer ||
                !selectedCustomer.phone ||
                !message.trim()
              }
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}

              {sending
                ? "Preparing WhatsApp..."
                : "Open WhatsApp"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              WhatsApp will open with the message pre-filled.
              The message is also recorded in the CRM activity
              history.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#ae884e]" />

              <div>
                <h2 className="font-semibold text-gray-900">
                  Recent WhatsApp Activity
                </h2>

                <p className="text-xs text-gray-500 mt-0.5">
                  Latest conversations opened by agents.
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[650px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />

                <p className="text-sm font-medium text-gray-600">
                  No WhatsApp activity yet
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Conversations opened from this panel will
                  appear here.
                </p>
              </div>
            ) : (
              logs.map((log) => {
                const customer = customers.find(
                  (item) =>
                    item.id === log.customer_id
                );

                return (
                  <div
                    key={log.id}
                    className="p-4 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {customer?.name ||
                              log.phone_number}
                          </p>

                          <span className="text-[10px] uppercase font-semibold text-green-600 shrink-0">
                            {log.status}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                          {log.message}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <p className="text-[10px] text-gray-400">
                            {formatDate(log.created_at)}
                          </p>

                          <a
                            href={`https://wa.me/${log.phone_number}?text=${encodeURIComponent(
                              log.message
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-medium text-[#1c3053] hover:text-[#ae884e] inline-flex items-center gap-1"
                          >
                            Reopen
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />

          <div>
            <p className="text-sm font-semibold text-blue-900">
              WhatsApp integration is active
            </p>

            <p className="text-xs text-blue-700 mt-1 leading-5">
              OneKey prepares the conversation, opens WhatsApp
              with the message ready to send, and records the
              activity in the CRM. Meta WhatsApp Business API
              credentials are not required for this workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}