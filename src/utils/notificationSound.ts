let audio: HTMLAudioElement | null = null;

export const playNotificationSound = () => {
  try {
    if (!audio) {
      audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.95; // Volume aumentado para o sino
    }
    
    // Clone the audio to allow multiple simultaneous plays
    const sound = audio.cloneNode() as HTMLAudioElement;
    sound.volume = 0.95; // Volume mais alto para notificações no sino
    sound.play().catch((error) => {
      // Silently fail if autoplay is blocked
      console.debug('Notification sound blocked:', error);
    });
  } catch (error) {
    console.debug('Error playing notification sound:', error);
  }
};
