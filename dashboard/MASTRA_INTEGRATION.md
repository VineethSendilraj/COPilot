# Mastra AI Integration

This document describes the Mastra AI integration in the COPilot dashboard, which replaces the 2-second polling with real-time data updates and intelligent analysis.

## Overview

The integration uses Mastra agents to:

- Analyze incidents in real-time as they're created
- Generate intelligent recommendations for course of action
- Provide contextual insights and alerts
- Eliminate the need for manual ticket-based insight updates

## Architecture

### Components

1. **Mastra Configuration** (`lib/mastra.ts`)

   - Defines AI agents for incident analysis and alert generation
   - Configures tools for data analysis and recommendations

2. **Real-time Data Hook** (`hooks/use-realtime-data.ts`)

   - Replaces 2-second polling with Supabase real-time subscriptions
   - Automatically updates data when changes occur in the database

3. **Mastra Insights Component** (`components/mastra-insights.tsx`)

   - Displays AI-generated insights and recommendations
   - Provides actionable buttons for recommended actions

4. **API Routes** (`app/api/mastra/`)
   - Handles AI agent calls from the frontend
   - Provides secure access to Mastra functionality

### Data Flow

1. **Real-time Updates**: Supabase subscriptions detect database changes
2. **Automatic Analysis**: New incidents trigger AI analysis via Mastra agents
3. **Intelligent Insights**: AI generates recommendations based on incident data
4. **UI Updates**: Components automatically display new insights and recommendations

## Features

### Real-time Data Updates

- ✅ Replaced 2-second polling with Supabase real-time subscriptions
- ✅ Automatic data refresh when incidents, alerts, or officers are updated
- ✅ No more manual refresh needed

### AI-Powered Analysis

- ✅ Intelligent incident analysis using Mastra agents
- ✅ Risk assessment and escalation detection
- ✅ Contextual recommendations for course of action

### Smart Recommendations

- ✅ Backup dispatch recommendations for high-risk incidents
- ✅ Resource allocation suggestions
- ✅ Safety protocol recommendations
- ✅ Escalation management guidance

### Actionable Insights

- ✅ Clickable action buttons for recommendations
- ✅ Real-time status updates
- ✅ Priority-based alert system

## Usage

### For Developers

The integration is automatically active when the dashboard loads. No additional configuration is needed.

### For Users

1. **View Insights**: Each incident now displays AI-generated insights below the standard data
2. **Take Actions**: Click on recommended action buttons to execute suggested responses
3. **Monitor Updates**: Insights update automatically as new data arrives

## Configuration

### Environment Variables

Ensure your `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key
```

### Mastra Agents

The system includes two main agents:

1. **Incident Analyzer**: Analyzes incidents and provides recommendations
2. **Alert Generator**: Generates contextual alerts based on incident patterns

## Benefits

- **Eliminates Manual Work**: No more tickets for insight updates
- **Real-time Intelligence**: Instant analysis of new incidents
- **Better Decision Making**: AI-powered recommendations for officers and supervisors
- **Improved Safety**: Proactive alerts and resource allocation suggestions
- **Reduced Response Time**: Immediate insights when incidents occur

## Future Enhancements

- Voice integration for hands-free operation
- Advanced pattern recognition across multiple incidents
- Integration with external police databases
- Predictive analytics for incident prevention
- Mobile app integration for field officers

## Troubleshooting

### Common Issues

1. **Insights not loading**: Check OpenAI API key configuration
2. **Real-time updates not working**: Verify Supabase connection and RLS policies
3. **Recommendations not actionable**: Ensure incident data is complete

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.
