
import { VideohubActivityView } from './components/views/activity/VideohubActivityView';
import { getServerSession } from 'next-auth';
import { UserHeader } from './components/navigation/header/UserHeader';
import { getVideohubActivityServerSide } from './api/videohubs/[[...slug]]/server-videohubs';
import { IUser } from './authentification/interfaces';
import { authOptions } from './api/auth/[...nextauth]/auth-util';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

const Home = async () => {
  const session = await getServerSession(authOptions);
  const user: IUser | undefined = session?.user as IUser;
  const t = await getTranslations('Home');

  if (user == undefined) {
    throw new Error("User must be logged in.")
  }

  const activities = await getVideohubActivityServerSide();
  activities.forEach(item => { item.time = new Date(item.time); });
  return (<div>
    <UserHeader user={user} />
    <div className='mt-10'>
      <h1 className='text-3xl font-bold mb-4'>{t('title')}</h1>
      <VideohubActivityView activityItems={activities} />
    </div>
  </div>);
}

export default Home
