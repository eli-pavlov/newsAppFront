import { Switch, Route } from 'wouter';
import Open from './pages/open/Open';
import Login from './pages/login/Login';
import Home from './pages/home/Home';
import Admin from './pages/admin/Admin';
import './App.css';

function App() {
  return (
    <Switch>
      <Route path="/" component={Open} />
      <Route path="/login" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route>
        <h1>404 - Not Found</h1>
      </Route>
    </Switch>
  );
}

export default App;