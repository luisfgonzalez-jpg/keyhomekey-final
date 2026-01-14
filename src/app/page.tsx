"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
  unit_number?: string;
  category?: string;
  assigned_to?: string;
  image_urls?: string[];
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  unit_number?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "maintenance",
    unit_number: "",
  });
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserAndTickets() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Set unit_number in newTicket if user has one
        if (profileData.unit_number) {
          setNewTicket((prev) => ({
            ...prev,
            unit_number: profileData.unit_number || "",
          }));
        }

        let ticketsQuery = supabase
          .from("tickets")
          .select("*")
          .order("created_at", { ascending: false });

        if (profileData.role === "resident") {
          ticketsQuery = ticketsQuery.eq("user_id", user.id);
        }

        const { data: ticketsData, error: ticketsError } =
          await ticketsQuery;

        if (ticketsError) throw ticketsError;
        setTickets(ticketsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndTickets();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedImages((prev) => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) return;

    try {
      const imageUrls: string[] = [];

      // Upload images to Supabase Storage
      for (const image of uploadedImages) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("ticket-images")
          .upload(fileName, image);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          continue;
        }

        imageUrls.push(fileName);
      }

      const { data, error } = await supabase
        .from("tickets")
        .insert([
          {
            title: newTicket.title,
            description: newTicket.description,
            priority: newTicket.priority,
            category: newTicket.category,
            unit_number: newTicket.unit_number || profile.unit_number,
            user_id: user.id,
            status: "open",
            image_urls: imageUrls,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setTickets([data[0], ...tickets]);
        setNewTicket({
          title: "",
          description: "",
          priority: "medium",
          category: "maintenance",
          unit_number: profile.unit_number || "",
        });
        setUploadedImages([]);
        setIsCreatingTicket(false);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket. Please try again.");
    }
  };

  const handleUpdateTicketStatus = async (
    ticketId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;

      setTickets(
        tickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket status. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPublicImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from("ticket-images")
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                KeyHomeKey Maintenance
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {profile?.full_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {profile?.role}
              </span>
              {profile?.unit_number && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  Unit {profile.unit_number}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Ticket Button */}
        {profile?.role === "resident" && !isCreatingTicket && (
          <div className="mb-6">
            <button
              onClick={() => setIsCreatingTicket(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Create New Ticket
            </button>
          </div>
        )}

        {/* Create Ticket Form */}
        {isCreatingTicket && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Ticket
              </h2>
              <button
                onClick={() => {
                  setIsCreatingTicket(false);
                  setUploadedImages([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newTicket.title}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the maintenance issue"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="appliance">Appliance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    value={newTicket.unit_number}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        unit_number: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={profile?.unit_number || "Enter unit number"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {uploadedImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative inline-block bg-gray-100 rounded p-2"
                      >
                        <span className="text-sm text-gray-700">
                          {image.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Submit Ticket
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTicket(false);
                    setUploadedImages([]);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {profile?.role === "resident" ? "Your Tickets" : "All Tickets"}
          </h2>

          {tickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No tickets found.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ticket.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{ticket.description}</p>

                    {/* Image Thumbnails */}
                    {ticket.image_urls && ticket.image_urls.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Attached Images:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {ticket.image_urls.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="relative w-24 h-24 cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
                              onClick={() =>
                                setSelectedImage(getPublicImageUrl(imageUrl))
                              }
                            >
                              <Image
                                src={getPublicImageUrl(imageUrl)}
                                alt={`Ticket image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority.toUpperCase()}
                      </span>
                      {ticket.category && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                          {ticket.category.toUpperCase()}
                        </span>
                      )}
                      {ticket.unit_number && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">
                          Unit {ticket.unit_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {profile?.role !== "resident" && (
                    <div className="ml-4">
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          handleUpdateTicketStatus(ticket.id, e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                ✕
              </button>
              <Image
                src={selectedImage}
                alt="Full size ticket image"
                width={1200}
                height={800}
                className="rounded-lg max-w-full h-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
