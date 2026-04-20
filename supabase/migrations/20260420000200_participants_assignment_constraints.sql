-- Backfill and enforce canonical participant assignment values.
begin;

update public.participants
set
  group_name = case
    when group_name in (
      'Facility Group',
      'Consultant Group',
      'Certification Review Group',
      'Program Observer Group'
    ) then group_name
    else 'Program Observer Group'
  end,
  scenario_name = case
    when scenario_name in (
      'First-Time Seeker',
      'Active Certified',
      'Lapsed / Not Renewed',
      'Failed / Revoked / Suspended / Remediation-Focused'
    ) then scenario_name
    else 'First-Time Seeker'
  end,
  wave_name = case
    when wave_name in ('Wave 1', 'Wave 2', 'Wave 3') then wave_name
    else 'Wave 1'
  end
where
  group_name is null
  or scenario_name is null
  or wave_name is null
  or group_name not in (
    'Facility Group',
    'Consultant Group',
    'Certification Review Group',
    'Program Observer Group'
  )
  or scenario_name not in (
    'First-Time Seeker',
    'Active Certified',
    'Lapsed / Not Renewed',
    'Failed / Revoked / Suspended / Remediation-Focused'
  )
  or wave_name not in ('Wave 1', 'Wave 2', 'Wave 3');

alter table public.participants
  alter column group_name set not null,
  alter column scenario_name set not null,
  alter column wave_name set not null;

alter table public.participants
  drop constraint if exists participants_group_name_allowed_check,
  drop constraint if exists participants_scenario_name_allowed_check,
  drop constraint if exists participants_wave_name_allowed_check;

alter table public.participants
  add constraint participants_group_name_allowed_check
    check (group_name in (
      'Facility Group',
      'Consultant Group',
      'Certification Review Group',
      'Program Observer Group'
    )),
  add constraint participants_scenario_name_allowed_check
    check (scenario_name in (
      'First-Time Seeker',
      'Active Certified',
      'Lapsed / Not Renewed',
      'Failed / Revoked / Suspended / Remediation-Focused'
    )),
  add constraint participants_wave_name_allowed_check
    check (wave_name in ('Wave 1', 'Wave 2', 'Wave 3'));

commit;
