import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';
import { useAuthContext } from '../../contexts/AuthContext';
import Loader from '../../components/Loader';
import './Home.css';

const Home = () => {
    const { user, isLoading } = useAuthContext();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!isLoading && !user) {
            setLocation('/login');
        }
    }, [user, isLoading, setLocation]);

    if (isLoading || !user) {
        return <Loader fullScreen={true} transparent={false} />;
    }

    return (
        <div className="page">
            <Header />
            <Main />
            <Footer />
        </div>
    );
};

export default Home;