import React from "react";
import Navbar from "@/components/Navbar";
import NoticeHeader from "@/components/notice/NoticeHeader";
import Footer from "@/components/Footer";
import { Notice } from "@prisma/client";
import Image from "next/image";

const imageLinks = {
  Technical:
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1000",
  General:
    "https://tls.or.tz/wp-content/uploads/2023/02/imprtant-notice-icon.png",
  Sponsorship:
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000",
};

async function load_data() {
  const res = await fetch(`${process.env.API_URL}/api/notices/`, {
    next: { revalidate: 1200 },
  });
  const parsed_response = await res.json();
  return parsed_response.notices as Notice[];
}

export default async function NoticePage() {
  const notices = await load_data();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "Sponsorship":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="fixed inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-blue/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary-purple/10 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 py-20">
        <NoticeHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices &&
            notices.map((notice) => (
              <div
                key={notice.notice_id}
                className="backdrop-blur-xl bg-black/30 rounded-lg border border-gray-800 overflow-hidden hover:border-primary-blue/50 transition-all duration-200"
              >
                {imageLinks[notice.category] && (
                  <div className="relative h-48">
                    <Image
                      src={imageLinks[notice.category]}
                      height={400}
                      width={600}
                      alt={notice.headline}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(
                        notice.category
                      )}`}
                    >
                      {notice.category}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(notice.postedOn).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {notice.headline}
                  </h3>
                  {notice.link && (
                    <p className="text-blue-500 text-md my-1">
                      <a href={notice.link}>View Attached File</a>
                    </p>
                  )}
                  <p className="text-gray-300 text-sm">{notice.body}</p>
                </div>
              </div>
            ))}
        </div>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
