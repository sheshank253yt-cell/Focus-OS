import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Schedule from "@/pages/Schedule";
import Tools from "@/pages/Tools";
import RoadmapList from "@/pages/RoadmapList";
import RoadmapDetail from "@/pages/RoadmapDetail";
import Analytics from "@/pages/Analytics";
import Notes from "@/pages/Notes";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function isAuthenticated(): boolean {
  return localStorage.getItem("focus_os_authed") === "true";
}

function LoginRoute() {
  if (isAuthenticated()) {
    return <Redirect to="/dashboard" />;
  }
  return <Login />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) {
    return <Redirect to="/" />;
  }

  return (
    <AppProvider userId="local-user">
      <TooltipProvider>
        <Layout>
          <Component />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </AppProvider>
  );
}

function App() {
  return (
    <Switch>
      <Route path="/" component={LoginRoute} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/schedule">
        {() => <ProtectedRoute component={Schedule} />}
      </Route>
      <Route path="/tools">
        {() => <ProtectedRoute component={Tools} />}
      </Route>
      <Route path="/roadmap">
        {() => <ProtectedRoute component={RoadmapList} />}
      </Route>
      <Route path="/roadmap/:id">
        {() => <ProtectedRoute component={RoadmapDetail} />}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute component={Analytics} />}
      </Route>
      <Route path="/notes">
        {() => <ProtectedRoute component={Notes} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
