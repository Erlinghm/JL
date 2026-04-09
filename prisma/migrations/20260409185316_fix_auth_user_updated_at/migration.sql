ALTER TABLE public."User"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION public.sync_supabase_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  local_user_id integer;
  derived_full_name text;
  derived_phone text;
  derived_status public."UserStatus";
  derived_is_admin boolean;
BEGIN
  derived_full_name := COALESCE(
    NULLIF(new.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(new.raw_user_meta_data ->> 'fullName', ''),
    INITCAP(REPLACE(SPLIT_PART(COALESCE(new.email, ''), '@', 1), '.', ' ')),
    'Bruker'
  );
  derived_phone := NULLIF(new.phone, '');
  derived_status := CASE
    WHEN new.confirmed_at IS NOT NULL OR new.email_confirmed_at IS NOT NULL
      THEN 'ACTIVE'::public."UserStatus"
    ELSE 'PENDING_VERIFICATION'::public."UserStatus"
  END;
  derived_is_admin := COALESCE((new.raw_app_meta_data ->> 'is_admin')::boolean, false);

  SELECT u.id
  INTO local_user_id
  FROM public."User" u
  WHERE u.auth_user_id = new.id;

  IF local_user_id IS NULL THEN
    SELECT u.id
    INTO local_user_id
    FROM public."User" u
    WHERE lower(u.email) = lower(new.email);
  END IF;

  IF local_user_id IS NULL THEN
    INSERT INTO public."User" (
      auth_user_id,
      email,
      "fullName",
      phone,
      status,
      is_admin,
      "createdAt",
      "updatedAt"
    )
    VALUES (
      new.id,
      lower(new.email),
      derived_full_name,
      derived_phone,
      derived_status,
      derived_is_admin,
      now(),
      now()
    )
    RETURNING id INTO local_user_id;
  ELSE
    UPDATE public."User" u
    SET
      auth_user_id = new.id,
      email = lower(new.email),
      phone = derived_phone,
      is_admin = derived_is_admin,
      status = CASE
        WHEN u.status = 'SUSPENDED'::public."UserStatus" THEN u.status
        ELSE derived_status
      END,
      "updatedAt" = now()
    WHERE u.id = local_user_id;
  END IF;

  INSERT INTO public."UserProfile" ("userId")
  VALUES (local_user_id)
  ON CONFLICT ("userId") DO NOTHING;

  RETURN new;
END;
$$;
