import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/PrismaClient/db";
import { position_options } from "@prisma/client";
import { getSession } from "@/lib/actions/Sessions";
import isAdmin from "@/lib/actions/Admin";
import z from "zod"

const competitionSchema = z.object({
    competitionName: z.string(),
    conductedOn: z.string(),
    conductedBy: z.string(),
    registration_deadline: z.string(),
    venue: z.string(),
    description: z.string(),
    prize: z.string(),
    min_team_size: z.number().min(1),
    max_team_size: z.number().min(1),
    imageURL: z.string()
});

export async function POST(req: NextRequest) {
    try{
        const body = await req.json();
        const schema = competitionSchema.safeParse(body);
        const session = await getSession();

        if (!session?.user || !(await isAdmin())) {
            return NextResponse.json(
              { error: "Failed to create meeting! Unauthenticated" },
              { status: 400 }
            );
        }

        if(!schema.success){
            return NextResponse.json({status: 400, message: "Bad Request"});
        }
        const {competitionName, conductedOn, conductedBy, registration_deadline, venue, description, prize, min_team_size, max_team_size, imageURL} = schema.data;

        if (max_team_size<min_team_size){
            return NextResponse.json({status: 400, message: "Max team size should be greater equal to min team size"});
        }

        if(isNaN(Date.parse(conductedOn))){
            return NextResponse.json({status: 400, message: "Invalid date format"});
        }

        if(isNaN(Date.parse(registration_deadline))){
            return NextResponse.json({status: 400, message: "Invalid date format on registration-deadline"});
        }

        const conductedOn_dt = new Date(conductedOn);
        const registration_deadline_dt = new Date(registration_deadline);

        const findName = await prisma.competitions.findUnique({
            where: {
                competitionName
            }
        });

        if (findName){
            console.log(findName);
            return NextResponse.json({status: 400, message: "Competition already exists"});
        }

        const competition = await prisma.competitions.create({
            data: {
                competitionName,
                conductedOn: conductedOn_dt,
                conductedBy,
                registration_deadline: registration_deadline_dt,
                venue,
                description,
                prize,
                min_team_size,
                max_team_size,
                imageURL,
                createdBy: {
                    connect: {id: session.user.id}
                }
            }
        });

        if(!competition){
            return NextResponse.json({status: 500, message: "Failed to create competition"});
        }
        
        return NextResponse.json({status: 200, message: "Competition created successfully"});

    }
    catch(err){
        console.log(err);
        return NextResponse.json({status: 500, message: "Internal Server Error"});
    }
}