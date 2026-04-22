// Extracted from roomHandlers.ts so the publish route and chat filter share
// the same banned-words list. Normalizes accents + common leetspeak before
// matching, then re-tests the raw string (defensive against false negatives).

const BANNED_WORDS = [
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'tranny',
  'kike', 'spic', 'chink', 'gook', 'wetback', 'beaner', 'coon',
  'dyke', 'paki', 'towelhead', 'raghead', 'cracker',
  'fuck', 'shit', 'ass', 'asshole', 'bitch', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'cunt', 'bastard', 'motherfucker', 'stfu', 'wtf',
  'nègre', 'negre', 'bougnoule', 'bougnoul', 'youpin', 'youpine',
  'bamboula', 'bicot', 'raton', 'chinetoque', 'bridé', 'bride',
  'tapette', 'pédé', 'pede', 'gouine', 'tarlouze', 'enculé', 'encule',
  'fils de pute', 'fdp', 'ntm', 'nique ta mere', 'nique ta mère',
  'pute', 'putain', 'salope', 'salaud', 'connard', 'connasse',
  'merde', 'bordel', 'bite', 'couille', 'branleur', 'branleuse',
  'nique', 'niquer', 'baiser', 'porn', 'porno',
  'pd', 'tg', 'ta gueule', 'ferme ta gueule', 'ftg',
  'batard', 'bâtard', 'abruti', 'débile', 'debile',
  'kill yourself', 'kys', 'suicide', 'gas the', 'heil hitler',
  'nazi', 'white power', 'white supremacy',
]

const bannedRegex = new RegExp(
  BANNED_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i',
)

function normalize(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/\$/g, 's')
    .replace(/@/g, 'a')
}

export function containsBannedWord(text: string): boolean {
  return bannedRegex.test(normalize(text)) || bannedRegex.test(text)
}
