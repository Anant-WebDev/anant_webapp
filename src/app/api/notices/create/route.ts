import prisma from "@/lib/PrismaClient/db";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { getSession } from "@/lib/actions/Sessions";
import isAdmin from "@/lib/actions/Admin";

const categoryEnum = z.enum(["General", "Technical", "Sponsorship"]);

const noticeSchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  body: z.string().min(1, "Body is required"),
  category: categoryEnum,
  link: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const input = await req.json();
  const schema = noticeSchema.safeParse(input);
  const session = await getSession();
  if (!session?.user || !(await isAdmin())) {
    return NextResponse.json(
      { error: "Failed to create meeting! Unauthenticated" },
      { status: 400 }
    );
  }

  if (!schema.success) {
    return NextResponse.json(
      { error: "Invalid schema", resolve: { issues: schema.error.issues } },
      { status: 400 }
    );
  }

  try {
    const notice = {
      headline: schema.data.headline,
      body: schema.data.body,
      category: schema.data.category,
      userID: session.user.id,
      link: schema.data.link,
    };

    const result = await prisma.notice.create({
      data: notice,
    });

    return NextResponse.json({ response: "Notice created!", notice: result });
  } catch (err) {
    console.error("Error in creating notice " ,err);
    return NextResponse.json(
      { error: "Failed to create notice!" },
      { status: 500 }
    );
  }
}
