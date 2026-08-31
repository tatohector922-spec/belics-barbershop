import { NextResponse } from 'next/server';

let subscriptions: any[] = [];

export function getSubscriptions() {
  return subscriptions;
}

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    if (!subscriptions.some(s => s.endpoint === subscription.endpoint)) {
      subscriptions.push(subscription);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}