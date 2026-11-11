/**
 * Interface copy, in both languages.
 *
 * English is the source of truth for the shape: `bn` is typed against it, so a
 * key added to one and forgotten in the other is a compile error rather than a
 * blank label in production.
 *
 * The Bangla is written as Bangla, not transliterated English — "আসন" for a
 * seat, "আবেদন" for an application, "ভর্তি ফি" for the admission fee — because
 * that is how a Bangladeshi parent reads this screen.
 */

export type Lang = "en" | "bn";

const en = {
  brand: "Seatly.",
  brandTagline: "School admission, without the queue",

  common: {
    seats: "seats",
    seat: "seat",
    of: "of",
    retry: "Try again",
    close: "Close",
    cancel: "Cancel",
    loading: "Loading",
    unknown: "Unknown",
    copied: "Copied",
  },

  language: {
    label: "Language",
    en: "English",
    bn: "বাংলা",
  },

  theme: {
    label: "Theme",
    light: "Light",
    dark: "Dark",
  },

  identity: {
    title: "Start your admission",
    description:
      "Enter the {digits}-digit birth registration number from your certificate. There is no account and no password — the number is your identity on this device, so you can close the browser and come back to your applications.",
    formTitle: "Enter your number",
    label: "Birth registration number",
    remaining: "{n} digits to go",
    remainingOne: "1 digit to go",
    complete: "Complete",
    placeholder: "{digits} digits",
    privacy: "Stored on this device only.",
    errorEmpty: "Enter your {digits}-digit birth registration number.",
    errorShort: "That number is too short — it needs all {digits} digits.",
    errorLong: "That number is too long — it needs to be exactly {digits} digits.",
    errorFormat: "Use digits only, with no spaces or letters.",
    submit: "Continue",
    previewSecure: "Secure & simple",
    previewPrivate: "Private on this device",
    previewTrack: "Track applications",
    change: "Use a different number",
    switching: "Switching student",
    switchWarning:
      "This device will forget the current number and show the new student's applications.",
  },

  nav: {
    search: "Search",
    searchPlaceholder: "Search navigation…",
    noResults: "No results",
    support: "Support",
    settings: "Settings",
    closeSidebar: "Close sidebar",
    clearSearch: "Clear search",
    account: "Account",
    accountTitle: "Your registration number",
    viewProfile: "View profile",
    logOut: "Log out",
    signOut: "Use a different number",
    switchStudent: "Switch student",
    openMenu: "Open menu",
    classes: "Classes",
    applications: "My applications",
    manage: "Manage classes",
    adminBadge: "Admin",
    skipToContent: "Skip to content",
  },

  classes: {
    heading: "Open classes",
    subheading: "Select a class to enroll in.",
    availableLabel: "available",
    full: "Full",
    almostFull: "Almost full",
    seatsLeft: "left",
    apply: "Apply for a seat",
    applying: "Holding a seat…",
    yourHold: "You have a seat held here",
    yourConfirmed: "Your admission is confirmed",
    emptyTitle: "No classes yet",
    emptyBody:
      "No class has been published. An administrator can add the first one from Manage classes.",
    emptyAction: "Add a class",
    totalSeats: "Total seats",
    held: "On hold",
    confirmed: "Confirmed",
    free: "Free",
  },

  hold: {
    heldTitle: "Seat held for you",
    expiresIn: "Expires in",
    expired: "This hold has expired",
    expiredBody:
      "The seat went back to the pool. Apply again if seats are still free.",
    confirmedTitle: "Admission confirmed",
    confirmedBody: "Your seat is secured. Nothing else is needed.",
    cancelledTitle: "Application cancelled",
    payFee: "Pay the admission fee",
    paying: "Confirming…",
    holdToConfirm: "Hold to confirm admission",
    holdingToConfirm: "Keep holding…",
    holdHint: "Press and hold until the bar is full.",
    classLabel: "Class",
    expiresLabel: "Seat expires",
    cancelApplication: "Cancel application",
    cancelling: "Cancelling…",
    confirmingBody:
      "This reserves the seat permanently. In a real school this is where the admission fee is paid.",
    cancellingTitle: "Cancel this application?",
    cancellingBody:
      "The seat returns to the pool immediately and someone else can take it.",
    cancelYes: "Cancel application",
    seatNumber: "Application",
  },

  mine: {
    heading: "My applications",
    subheading: "Everything you have applied for with this number, newest first.",
    emptyTitle: "No applications yet",
    emptyBody:
      "Apply for a seat in any open class and it will appear here — even after you close the browser.",
    browse: "Browse classes",
    statusHeld: "Seat held",
    statusConfirmed: "Confirmed",
    statusExpired: "Expired",
    statusCancelled: "Cancelled",
    appliedAt: "Applied",
    expiresAt: "Expires",
    confirmedAt: "Confirmed",
  },

  manage: {
    heading: "Manage classes",
    subheading:
      "Create a class with a fixed number of seats. Seats are never oversold, even under load.",
    add: "Add class",
    formTitle: "New class",
    nameLabel: "Class name",
    namePlaceholder: "Class 6 — Morning shift",
    nameHint: "Up to {max} characters.",
    seatsLabel: "Total seats",
    seatsHint: "Between {min} and {max}.",
    create: "Create class",
    creating: "Creating…",
    created: "Class created",
    existing: "Existing classes",
    emptyBody: "Use “Add class” above to publish the first one.",
    errorName: "Give the class a name.",
    errorSeats: "Seats must be a whole number between {min} and {max}.",
  },

  freshness: {
    updated: "Updated",
    updatedAt: "Updated {time}",
    updating: "Updating…",
    offline: "Can't reach the server",
    offlineBody: "Retrying automatically. Counts below may be out of date.",
    live: "Live",
    paused: "Paused",
  },

  errors: {
    genericTitle: "Something went wrong",
    networkTitle: "Server unreachable",
    networkBody:
      "The admission server is not answering. Check that it is running, then try again.",
    forbiddenTitle: "Not your application",
    notFoundTitle: "Not found",
    fullTitle: "No seats left",
    expiredTitle: "Application expired",
    duplicateTitle: "Already applied",
    invalidTitle: "Check your details",
  },

  toast: {
    holdCreated: "Seat held for {minutes} minutes",
    holdCreatedBody: "Confirm before the timer runs out or the seat is released.",
    confirmed: "Admission confirmed",
    confirmedBody: "The seat is now permanently yours.",
    cancelled: "Application cancelled",
    cancelledBody: "The seat is available to other students again.",
    classCreated: "Class created",
    expired: "Hold expired",
    expiredBody: "The seat was released because time ran out.",
  },

  footer: {
    note: "Seats are held for a limited time, then released automatically.",
  },
} as const;

export type Copy = DeepWiden<typeof en>;

/** Turns literal string types back into `string`, recursively. */
type DeepWiden<T> = T extends string
  ? string
  : { [K in keyof T]: DeepWiden<T[K]> };

const bn: Copy = {
  brand: "Seatly.",
  brandTagline: "লাইনে দাঁড়ানো ছাড়াই স্কুলে ভর্তি",

  common: {
    seats: "আসন",
    seat: "আসন",
    of: "এর মধ্যে",
    retry: "আবার চেষ্টা করুন",
    close: "বন্ধ করুন",
    cancel: "বাতিল",
    loading: "লোড হচ্ছে",
    unknown: "অজানা",
    copied: "কপি হয়েছে",
  },

  language: {
    label: "ভাষা",
    en: "English",
    bn: "বাংলা",
  },

  theme: {
    label: "থিম",
    light: "উজ্জ্বল",
    dark: "অন্ধকার",
  },

  identity: {
    title: "ভর্তি শুরু করুন",
    description:
      "সনদে লেখা {digits} সংখ্যার জন্ম নিবন্ধন নম্বরটি লিখুন। কোনো অ্যাকাউন্ট বা পাসওয়ার্ড লাগবে না — এই নম্বরই এই ডিভাইসে আপনার পরিচয়, তাই ব্রাউজার বন্ধ করেও ফিরে এসে নিজের আবেদন দেখতে পারবেন।",
    formTitle: "নম্বরটি লিখুন",
    label: "জন্ম নিবন্ধন নম্বর",
    remaining: "{n} সংখ্যা বাকি",
    remainingOne: "আর ১ সংখ্যা বাকি",
    complete: "সম্পূর্ণ",
    placeholder: "{digits} সংখ্যা",
    privacy: "শুধু এই ডিভাইসে সংরক্ষিত।",
    errorEmpty: "আপনার {digits} সংখ্যার জন্ম নিবন্ধন নম্বরটি লিখুন।",
    errorShort: "নম্বরটি ছোট — পুরো {digits} সংখ্যা দরকার।",
    errorLong: "নম্বরটি বড় — ঠিক {digits} সংখ্যা হতে হবে।",
    errorFormat: "শুধু সংখ্যা লিখুন, ফাঁকা জায়গা বা অক্ষর নয়।",
    submit: "এগিয়ে যান",
    previewSecure: "নিরাপদ ও সহজ",
    previewPrivate: "এই ডিভাইসে গোপন",
    previewTrack: "আবেদন দেখুন",
    change: "অন্য নম্বর ব্যবহার করুন",
    switching: "শিক্ষার্থী বদলানো হচ্ছে",
    switchWarning:
      "এই ডিভাইস বর্তমান নম্বরটি ভুলে যাবে এবং নতুন শিক্ষার্থীর আবেদন দেখাবে।",
  },

  nav: {
    search: "খুঁজুন",
    searchPlaceholder: "মেনুতে খুঁজুন…",
    noResults: "কিছু পাওয়া যায়নি",
    support: "সহায়তা",
    settings: "সেটিংস",
    closeSidebar: "সাইডবার বন্ধ করুন",
    clearSearch: "খোঁজা মুছুন",
    account: "অ্যাকাউন্ট",
    accountTitle: "আপনার নিবন্ধন নম্বর",
    viewProfile: "প্রোফাইল দেখুন",
    logOut: "বেরিয়ে যান",
    signOut: "অন্য নম্বর ব্যবহার করুন",
    switchStudent: "শিক্ষার্থী বদলান",
    openMenu: "মেনু খুলুন",
    classes: "ক্লাস",
    applications: "আমার আবেদন",
    manage: "ক্লাস ব্যবস্থাপনা",
    adminBadge: "অ্যাডমিন",
    skipToContent: "মূল অংশে যান",
  },

  classes: {
    heading: "খোলা ক্লাস",
    subheading: "ভর্তির জন্য একটি ক্লাস বেছে নিন।",
    availableLabel: "খালি",
    full: "পূর্ণ",
    almostFull: "প্রায় পূর্ণ",
    seatsLeft: "বাকি",
    apply: "আসনের জন্য আবেদন",
    applying: "আসন সংরক্ষণ হচ্ছে…",
    yourHold: "এখানে আপনার একটি আসন সংরক্ষিত আছে",
    yourConfirmed: "আপনার ভর্তি নিশ্চিত হয়েছে",
    emptyTitle: "এখনো কোনো ক্লাস নেই",
    emptyBody:
      "কোনো ক্লাস প্রকাশ করা হয়নি। প্রশাসক “ক্লাস ব্যবস্থাপনা” থেকে প্রথমটি যোগ করতে পারেন।",
    emptyAction: "ক্লাস যোগ করুন",
    totalSeats: "মোট আসন",
    held: "সংরক্ষিত",
    confirmed: "নিশ্চিত",
    free: "খালি",
  },

  hold: {
    heldTitle: "আপনার জন্য আসন সংরক্ষিত",
    expiresIn: "সময় বাকি",
    expired: "এই সংরক্ষণটির মেয়াদ শেষ",
    expiredBody:
      "আসনটি আবার খালি আসনে ফিরে গেছে। আসন থাকলে আবার আবেদন করুন।",
    confirmedTitle: "ভর্তি নিশ্চিত হয়েছে",
    confirmedBody: "আপনার আসনটি নিশ্চিত। আর কিছু করার দরকার নেই।",
    cancelledTitle: "আবেদন বাতিল হয়েছে",
    payFee: "ভর্তি ফি দিন",
    paying: "নিশ্চিত করা হচ্ছে…",
    holdToConfirm: "ভর্তি নিশ্চিত করতে ধরে রাখুন",
    holdingToConfirm: "ধরে রাখুন…",
    holdHint: "বারটি পূর্ণ না হওয়া পর্যন্ত চেপে ধরে রাখুন।",
    classLabel: "ক্লাস",
    expiresLabel: "আসনের মেয়াদ",
    cancelApplication: "আবেদন বাতিল",
    cancelling: "বাতিল হচ্ছে…",
    confirmingBody:
      "এতে আসনটি স্থায়ীভাবে আপনার হবে। বাস্তব স্কুলে এখানেই ভর্তি ফি দেওয়া হয়।",
    cancellingTitle: "এই আবেদনটি বাতিল করবেন?",
    cancellingBody:
      "আসনটি সঙ্গে সঙ্গে খালি হয়ে যাবে এবং অন্য কেউ নিতে পারবে।",
    cancelYes: "আবেদন বাতিল করুন",
    seatNumber: "আবেদন",
  },

  mine: {
    heading: "আমার আবেদন",
    subheading: "এই নম্বর থেকে করা সব আবেদন, নতুনটি আগে।",
    emptyTitle: "এখনো কোনো আবেদন নেই",
    emptyBody:
      "খোলা কোনো ক্লাসে আসনের জন্য আবেদন করুন — ব্রাউজার বন্ধ করার পরেও সেটি এখানে দেখা যাবে।",
    browse: "ক্লাস দেখুন",
    statusHeld: "আসন সংরক্ষিত",
    statusConfirmed: "নিশ্চিত",
    statusExpired: "মেয়াদ শেষ",
    statusCancelled: "বাতিল",
    appliedAt: "আবেদন",
    expiresAt: "মেয়াদ",
    confirmedAt: "নিশ্চিত",
  },

  manage: {
    heading: "ক্লাস ব্যবস্থাপনা",
    subheading:
      "নির্দিষ্ট সংখ্যক আসন দিয়ে ক্লাস তৈরি করুন। চাপ থাকলেও আসন কখনো বেশি বিক্রি হয় না।",
    add: "ক্লাস যোগ করুন",
    formTitle: "নতুন ক্লাস",
    nameLabel: "ক্লাসের নাম",
    namePlaceholder: "ষষ্ঠ শ্রেণি — সকাল শিফট",
    nameHint: "সর্বোচ্চ {max} অক্ষর।",
    seatsLabel: "মোট আসন",
    seatsHint: "{min} থেকে {max} এর মধ্যে।",
    create: "ক্লাস তৈরি করুন",
    creating: "তৈরি হচ্ছে…",
    created: "ক্লাস তৈরি হয়েছে",
    existing: "বর্তমান ক্লাস",
    emptyBody: "উপরের “ক্লাস যোগ করুন” বোতাম থেকে প্রথমটি যোগ করুন।",
    errorName: "ক্লাসের একটি নাম দিন।",
    errorSeats: "আসন {min} থেকে {max} এর মধ্যে পূর্ণসংখ্যা হতে হবে।",
  },

  freshness: {
    updated: "হালনাগাদ",
    updatedAt: "হালনাগাদ {time}",
    updating: "হালনাগাদ হচ্ছে…",
    offline: "সার্ভারে পৌঁছানো যাচ্ছে না",
    offlineBody: "স্বয়ংক্রিয়ভাবে আবার চেষ্টা হচ্ছে। নিচের সংখ্যা পুরোনো হতে পারে।",
    live: "সরাসরি",
    paused: "থেমে আছে",
  },

  errors: {
    genericTitle: "কিছু একটা ভুল হয়েছে",
    networkTitle: "সার্ভারে পৌঁছানো যাচ্ছে না",
    networkBody:
      "ভর্তি সার্ভার সাড়া দিচ্ছে না। এটি চালু আছে কি না দেখে আবার চেষ্টা করুন।",
    forbiddenTitle: "এটি আপনার আবেদন নয়",
    notFoundTitle: "পাওয়া যায়নি",
    fullTitle: "আসন শেষ",
    expiredTitle: "আবেদনের মেয়াদ শেষ",
    duplicateTitle: "আগেই আবেদন করা হয়েছে",
    invalidTitle: "তথ্য যাচাই করুন",
  },

  toast: {
    holdCreated: "{minutes} মিনিটের জন্য আসন সংরক্ষিত",
    holdCreatedBody: "সময় শেষ হওয়ার আগে নিশ্চিত করুন, নয়তো আসন ছেড়ে যাবে।",
    confirmed: "ভর্তি নিশ্চিত হয়েছে",
    confirmedBody: "আসনটি এখন স্থায়ীভাবে আপনার।",
    cancelled: "আবেদন বাতিল হয়েছে",
    cancelledBody: "আসনটি আবার অন্য শিক্ষার্থীদের জন্য খালি।",
    classCreated: "ক্লাস তৈরি হয়েছে",
    expired: "সংরক্ষণের মেয়াদ শেষ",
    expiredBody: "সময় শেষ হওয়ায় আসনটি ছেড়ে দেওয়া হয়েছে।",
  },

  footer: {
    note: "আসন নির্দিষ্ট সময়ের জন্য সংরক্ষিত থাকে, পরে স্বয়ংক্রিয়ভাবে ছেড়ে দেওয়া হয়।",
  },
};

export const dictionaries: Record<Lang, Copy> = { en, bn };

export function getCopy(lang: Lang): Copy {
  return dictionaries[lang];
}
