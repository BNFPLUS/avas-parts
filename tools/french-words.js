/* Words that only occur in the French fiche names (bike-parts-honda.com, French
   pages), used to find display names still in French. Words that are also
   English ("support", "suspension", "circlip", "lateral") are left out, and so
   are stubs the fiche cut ("(DE…"). */
const FR = new Set(`aeau afriction agrafe alimentation allumage amortisseur ampoule anneau appui arbre arondelle arret arriere association
auxiliaire auxiliairede auxiliairedemoteur avd avertissement avertisseur avg axe bague bagues bande batterie bequillelaterale bequilleprincipale
bielle billes blanc blocage bobine boitier bouchon boueav boulon bras bride broche butee cables
cadre cames caoutchouc capteur carburant carburateur carter centrage cerclage chaine chainedistribution chambre chapeau cle
clef cles clignotant clignotante cloche coautchouc coin collier combinaison commande commutateur commutateurchangement composant compteur
controle cordon corps coulisseau couvercle couverclepoignee couvercles crochet culbuteur cylindre de debordement decadre decarburant
decentrale declenchement decommande demarrage demarreur demarreura demi demoteur deradiateur des desgaz desiege dessus detecteur
detransmission detresse devitesse disque douille du duclignotant dudemarreur durite eau eclairage ecrou electrique electronique
embrayage engrenage ens ensemble entrainement entree et etai etiquette etverrouillage factice faisceau fils filtre
flexiblecarburant fourch fourche frein freinav garde garniture gaz generateur goujon gradateur guidedepompe guidon haut
haute ht huile immatriculation indicateur inf inferieur intelligente interieur exterieur interrupteur jante jeu lanceur
laterale lentille levier liaison logement lumiere maitre marche marchepied menee miroir monteur monture moteur
moyeu obturateur oscillant outil ouverture panneau papillon passager phare pied pignon plaque plateau plongeur
pneu poids poignee pompe pot poussiere poussoir pression primaire promaire queue radiateur ralenti rappel
rayon rebond refroidissement reglage regulateur relais remplissage reniflard renvoi reservoir ressort revetement
rigidite robinet rochet rondelle roue rouleau roulement sec secondaire separateur serrage serragedurite siege sielle
sonore sortie soupape sous speciale sup superieur systeme tendeur tete tige tirant torique touches
trou tubulure tuyau une unidirectionnel unite ventilateur verrouillage vidange vinyle vis visee vitesse voie
volant volet noir argent rouge bleu gris metallique metallise perle`.split(/\s+/));
module.exports = function isFrench(name) {
  const ws = String(name).toLowerCase().replace(/\*[^*]*\*/g, " ").replace(/\S+…/g, " ")
    .match(/[a-zàâçéèêëîïôûùüÿ']+/g) || [];
  return ws.some(w => FR.has(w) || /^[dl]'/.test(w));
};
