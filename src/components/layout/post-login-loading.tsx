export function PostLoginLoading() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-md">
      <img
        src="/branding/nihug-loading.png"
        alt=""
        width={160}
        height={160}
        className="sheelonim-loader-logo size-36 object-contain drop-shadow-sm sm:size-40"
      />
      <p className="text-base font-medium text-muted-foreground">
        טוען את מסך הניהול…
      </p>
    </div>
  );
}
