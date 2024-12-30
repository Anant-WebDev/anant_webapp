import { decodeAttendanceJwt } from "@/lib/actions/AttendenceJwt";
import { getSession } from "@/lib/actions/Sessions";
import prisma from "@/lib/PrismaClient/db";
import { attendanceData } from "@/types/meet_data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  console.log(session);
  
  const token = req.nextUrl.searchParams.get("token");
  console.log("found token", token);

  if (!token) {
    return NextResponse.json(
      { error: "Meeting token not found!!" },
      { status: 400 }
    );
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Login first!!" }, { status: 400 });
  }

  const userId = session.user.id;
  let parseToken: attendanceData;

  try {
    const decodedToken = await decodeAttendanceJwt(token);

    if (typeof decodedToken === "string") {
      parseToken = JSON.parse(decodedToken) as attendanceData;
    } else {
      parseToken = decodedToken as attendanceData;
    }
  } catch (err) {
    console.log("Error while decoding and parsing", err);
    return NextResponse.json(
      { error: "Invalid token or unable to decode it!" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.meeting.update({
      where: {
        meeting_id: parseToken.meeting_id,
      },
      data: {
        attendees: {
          connect: [{ id: userId }],
        },
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.log("Error updating meeting attendees", err);
    return NextResponse.json(
      { error: "Failed to update meeting attendees" },
      { status: 500 }
    );
  }
}