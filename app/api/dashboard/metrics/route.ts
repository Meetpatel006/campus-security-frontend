import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const { cameras, alerts } = await getDb();
    
    // Get active cameras count
    const activeCameras = await cameras.countDocuments({ status: 'active' });
    
    // Get recent alerts (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentAlerts = await alerts.countDocuments({ 
      timestamp: { $gte: oneDayAgo } 
    });
    
    // System status is operational if we can query the database
    const systemStatus = 'Operational';
    
    return NextResponse.json({
      activeCameras,
      systemStatus,
      recentAlerts,
    });
    
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
