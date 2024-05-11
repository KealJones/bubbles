export interface Card {
  value: number;
  name: string;
  suit: "CLUBS" | "HEARTS" | "SPADES" | "DIAMONDS";
}

const specialCardMap = new Map();
specialCardMap.set(1, { name: "A", value: 11 });
specialCardMap.set(11, { name: "J", value: 10 });
specialCardMap.set(12, { name: "Q", value: 10 });
specialCardMap.set(13, { name: "K", value: 10 });

const card = (index: number, name: Card["suit"]) => ({
  value: index,
  name: `${index}`,
  suit: name,
  ...specialCardMap.get(index),
});

const suit = (name: Card["suit"]) => {
  return new Array(13).fill(card).map((card, i) => card(i + 1, name));
};

export const getDecks = (deckCount = 1) => {
  function singleDeck() {
    return [
      suit("CLUBS"),
      suit("HEARTS"),
      suit("SPADES"),
      suit("DIAMONDS"),
    ].flat();
  }
  return new Array(deckCount).fill(singleDeck()).flat();
};
