import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is missing.' },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase environment variables are missing.',
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const question =
      typeof body.question === 'string' && body.question.trim()
        ? body.question.trim()
        : 'Provide an overall safety analysis and prioritized recommendations.';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const [
      incidentsResult,
      machinesResult,
      sensorDataResult,
      alertsResult,
      workersResult,
      permitsResult,
    ] = await Promise.all([
      supabase
        .from('incidents')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(30),

      supabase.from('machines').select('*').limit(50),

      supabase.from('sensor_data').select('*').limit(50),

      supabase.from('alerts').select('*').limit(30),

      supabase.from('workers').select('*').limit(50),

      supabase.from('permits').select('*').limit(50),
    ]);

    const databaseResults = [
      { name: 'incidents', result: incidentsResult },
      { name: 'machines', result: machinesResult },
      { name: 'sensor_data', result: sensorDataResult },
      { name: 'alerts', result: alertsResult },
      { name: 'workers', result: workersResult },
      { name: 'permits', result: permitsResult },
    ];

    const failedQuery = databaseResults.find(
      ({ result }) => result.error
    );

    if (failedQuery) {
      console.error(
        `SUPABASE ERROR [${failedQuery.name}]:`,
        failedQuery.result.error
      );

      return NextResponse.json(
        {
          success: false,
          error: `Database query failed for ${failedQuery.name}: ${failedQuery.result.error?.message}`,
        },
        { status: 500 }
      );
    }

    const safetyContext = {
      incidents: incidentsResult.data ?? [],
      machines: machinesResult.data ?? [],
      sensorData: sensorDataResult.data ?? [],
      alerts: alertsResult.data ?? [],
      workers: workersResult.data ?? [],
      permits: permitsResult.data ?? [],
    };

    const prompt = `
You are SafeSphere AI, an industrial safety analysis assistant.

Analyze only the supplied industrial safety database snapshot.

Tasks:
1. Identify major safety risks.
2. Detect incident patterns.
3. Identify machines requiring attention.
4. Analyze alerts and sensor readings.
5. Identify permit-related risks.
6. Recommend prioritized corrective actions.

Rules:
- Never invent database facts.
- Clearly mention insufficient data.
- Do not claim guaranteed safety predictions.
- Prioritize critical and actionable issues.
- Keep the response concise and useful.

USER QUESTION:
${question}

DATABASE SNAPSHOT:
${JSON.stringify(safetyContext)}
`;

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    console.log('Calling Gemini API...');

    const result = await model.generateContent(prompt);

    const analysis = result.response.text();

    console.log('Gemini API success');

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        incidentsAnalyzed: safetyContext.incidents.length,
        machinesAnalyzed: safetyContext.machines.length,
        sensorReadingsAnalyzed: safetyContext.sensorData.length,
        alertsAnalyzed: safetyContext.alerts.length,
        workersAnalyzed: safetyContext.workers.length,
        permitsAnalyzed: safetyContext.permits.length,
      },
    });
  } catch (error: any) {
  console.error("FULL ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      message: error?.message || "Unknown error",
      status: error?.status || null,
      statusText: error?.statusText || null,
      details: error?.errorDetails || error?.cause || null,
      stack: error?.stack || null,
    },
    { status: 500 }
  );
}
}