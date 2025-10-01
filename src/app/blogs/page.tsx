import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogsHeader from "@/components/blogs/BlogsHeader";
import BlogCard from "@/components/blogs/BlogCard";
import { Blog } from "@prisma/client";

type BlogProp = Blog & {
  writtenBy: { name: string };
};

export default async function BlogsPage() {
  const { blogs } = await getBlogs();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="fixed inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-blue/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary-purple/10 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 py-20">
        <BlogsHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {blogs.map((blog: BlogProp) => (
            <BlogCard key={blog.id} {...blog} />
          ))}
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export async function getBlogs() {
  try {
    const response = await fetch(`${process.env.API_URL}/api/blogs`, {
      next: { revalidate: 1200 },
    });

    if (!response.ok) throw new Error("Failed to fetcch blogs");

    const data = await response.json();

    if (!data) {
      return { blogs: [] };
    }

    return { blogs: data.blogs };
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return { blogs: [] };
  }
}
