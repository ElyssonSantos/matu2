import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Role = 'admin' | 'manager' | 'seller' | 'customer';

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (!error && data) {
        setRoles(data.map(r => r.role as Role));
      }
      setLoading(false);
    };

    if (user) {
      fetchRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const hasRole = (role: Role) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isSeller = hasRole('seller');
  const isStaff = isAdmin || isManager || isSeller;

  return { roles, hasRole, isAdmin, isManager, isSeller, isStaff, loading };
}