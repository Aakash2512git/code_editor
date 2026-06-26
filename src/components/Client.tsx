import Avatar from 'react-avatar';

interface ClientProps {
  username: string;
}

const Client = ({ username }: ClientProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar name={username} size="40" round="12px" />
      <span className="text-xs text-zinc-400 truncate max-w-[80px]">{username}</span>
    </div>
  );
};

export default Client;
