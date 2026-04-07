1. Libery
	1. Was ist es?
		1. Ist der Speicher der Website
		2. Kontrolliert nav als auch grig
		3. hier sollen als einziges harte Zahlen (Feste Werte) herkommen
			1. Wo kommen die Zahlen her.
				1.  Größe des WIndows
				2. Seitenverhätnisse des Contents
				3. Farben von der Farbkarte
				4. Schriftart, Schriftgrößen, als verhätlnisse zu einander
2. Nav Layer
	1. Was ist es?
		1. Das Navigationssystem.
		2. es zeigt an welche page und projekt aktuell zu sehen ist und als nächstes kommt, also auch unten rechts den website nahmen
	2. Wie sieht dieser aus?
		1. Vier vierecke, eines in jeder ecke des windows
			1. wie groß sind sie?
				1. 20 prozent der window größe 
					1. die fenstergröße wird von der libery aus gesteuert
	3. Was können die Nav Quads?
		1. Orientierung geben, die seiten und proejkte anzeigen.
		2. Man soll auf sie klicken können, dann wird zu dem angezeigten projekt oder seite eine transition gemacht. 
		3. die seigte beginnt mit einem loading screen an dem alle vier quads so skaliert sind, das sie sich an den kanten berühren und den kompletten bildschirm bedecken. sie öffnen sich dann und revealen das grid mit dem content. 
		4. die gleiche animation spielt auch bei den kapiteln wechseln. zuerst umgekehrt um die seite zu schleißen, dann word der name des kapitels angezeigt. dann öffnen sich die quads wieder wie beim loading screen.
		5. wenn man auf die nächste seite nach unten scrollt transitioned das untere linke nav quad nach oben und schiebt das obere linke nav quad weg. wenn man nach oben scrollt umgekehrt, dann geht das obere linke auf das untere. diese transition gibt es nur beim seiten wechsel, beim scrolen zwischen sections einer seite gibt es das nicht. 
		6. Die Nav Quads sind der Oberste LAyer in Z höhe
3. Grid (CDS)
	1. Was ist es?
		1. Ordnet und stellt die Inhalte da
			1. Wo bekommt es die her?
				1. Aus der LIbery
		2. Wie sieht es aus?
			1. Es wird durch den aufbau die
				1. inhalte der
					1. jeweiligen section 
						1. der jeweiligen seite 
							1. des jeweiligen projekts
			2. generiert
		3. Wie ist diese aufbau Strukturiert?
			1. Durch die anzahl an mains und subs der jeweiligen section wir eine anzahl an spalten erstellt die breite dieser spalten wird von der breite der jeweiligen contents abgeleitet. 
			2. Zuerst wären auf basis der window breite die mögliche skalierungder mains berechnet, auf basis ihrer breite, der anzahl der mains und subs zusammen + der platzhalter spalte. dann wird auf basis der mains die größe der subs berechnet, dann kommt ggf noch einen platzhalter spalte bei mehren main dazwischen. anschließend wird das grid ober un unterhalb der contents mit fill vierecken aufgefüllt. 
	2. Welche transitions gibt es?
		1. Kapitel / Proejkte
			1. Zwischen kapiteln regelt der lav layer. hier wird einfach die neuen seite geladen, sobald sich die quads wieder öfnnen
			2. die proejkt beschriftung ändert sich passend
		2. Pages / Seiten
			1. Scroll animation aus vertikalem übergang. 
			2. zusätzlich zeigt die transition den nav quads den page wechsel an
			3. die beschriftung ändert sich
			4. ein seiten ende muss einen leichten überscroll puffer haben, damit nicht zu schnell zur nächsten seite gesprungen wird
		3. Sections
			1. scroll animation
				1. Scroll animation aus vertikalem übergang. 