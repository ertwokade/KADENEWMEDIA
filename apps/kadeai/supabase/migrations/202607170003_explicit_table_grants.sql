-- Make Data API table privileges explicit so restored and newly created projects
-- behave identically. RLS remains the row-level authorization boundary.

GRANT USAGE ON SCHEMA public TO authenticated, service_role;

REVOKE ALL ON TABLE
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.brands,
  public.user_preferences,
  public.integrations,
  public.tool_runs,
  public.content_calendar_items,
  public.content_templates,
  public.content_history,
  public.operations_state,
  public.payment_orders,
  public.payment_events
FROM anon;

REVOKE ALL ON TABLE
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.brands,
  public.user_preferences,
  public.integrations,
  public.tool_runs,
  public.content_calendar_items,
  public.content_templates,
  public.content_history,
  public.operations_state,
  public.payment_orders,
  public.payment_events
FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.brands,
  public.user_preferences,
  public.integrations,
  public.tool_runs,
  public.content_calendar_items,
  public.content_templates
TO authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.content_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.operations_state TO authenticated;
GRANT SELECT ON TABLE public.payment_orders TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.brands,
  public.user_preferences,
  public.integrations,
  public.tool_runs,
  public.content_calendar_items,
  public.content_templates,
  public.content_history,
  public.operations_state,
  public.payment_orders,
  public.payment_events
TO service_role;
