export default async function RoomPage(props: PageProps<"/room/[code]">) {
  const { code } = await props.params;
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-muted text-sm uppercase tracking-widest mb-3">Room</p>
        <h1 className="text-6xl font-black tracking-[0.5rem] text-paper font-mono">
          {code.toUpperCase()}
        </h1>
        <p className="mt-8 text-muted">
          Lobby screen coming next — this is where players gather.
        </p>
      </div>
    </main>
  );
}
