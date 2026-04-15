// List of 20 cute and cheesy congratulations messages
const sweetMessages = [
  "You make my heart skip a beat! 💖",
  "You're the sprinkles on my cupcake! 🧁",
  "You're the peanut butter to my jelly! 🥜",
  "I love you to the moon and back! 🌙",
  "You're my sunshine on a cloudy day! ☀️",
  "You complete me like the last piece of a puzzle! 🧩",
  "You're sweeter than a box of chocolates! 🍫",
  "My heart races every time I see you! 💓",
  "You're the cheese to my macaroni! 🧀",
  "You light up my world like nobody else! ✨",
  "You're my favorite notification! 📱",
  "You're the avocado to my toast! 🥑",
  "Every love song reminds me of you! 🎵",
  "You're my cup of tea! ☕",
  "You're the apple of my eye! 🍎",
  "I'm nuts about you! 🥜",
  "You're my happy place! 🏡",
  "You're the marshmallow to my hot chocolate! ☕",
  "You're my favorite person in the whole world! 🌍",
  "You make my heart do backflips! 🤸"
];

export const generateSweetNote = async (): Promise<string> => {
  // Return a random message from the list
  const randomIndex = Math.floor(Math.random() * sweetMessages.length);
  return sweetMessages[randomIndex];
};
