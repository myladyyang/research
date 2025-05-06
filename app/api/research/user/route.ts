import {  NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/auth";
import { dbService } from '@/services/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;



  if (!userId) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const researches = await dbService.getUserResearches(userId);
  return NextResponse.json(researches);
  
  
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  console.log('userId', userId);
}
