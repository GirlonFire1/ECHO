import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, adminOnly = false, ...rest }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <Route {...rest}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-950">
              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
          );
        }

        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }

        if (adminOnly && user?.role !== 'admin') {
          return <Redirect to="/" />;
        }
        return <Component {...params} />;
      }}
    </Route>
  );
};
