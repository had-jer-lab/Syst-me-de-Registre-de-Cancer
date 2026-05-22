import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomFieldsPage from './CustomFieldsPage';
import { API_BASE_URL } from '../utils/apiConfig';

// ─── API Helper ───────────────────────────────────────────────────────────────
const API = API_BASE_URL;
const WILAYAS_COMMUNES = {
  'Adrar':['Timekten','Bouda','Ouled Ahmed Timmi','Adrar','Fenoughil','In Zghmir','Reggane','Sali','Sebaa','Tsabit','Tamest','Tamantit','Tit','Zaouiet Kounta','Akabli','Aoulef'],
  'Chlef':['Talassa','Zeboudja','El Hadjadj','Ouled Ben Abdelkader','Ain Merane','Breira','Ouled Abbes','Oued Fodda','Beni Rached','Herenfa','Tadjena','El Marsa','Chlef','Oum Drou','Sendjas','Sidi Abderrahmane','Sidi Akkacha','Tenes','Beni  Bouattab','El Karimia','Harchoun','Bouzeghaia','Taougrit','Beni Haoua','Abou El Hassane','Oued Goussine','Chettia','Moussadek','Ouled Fares','Boukadir','Oued Sly','Sobha','Benairia','Labiod Medjadja','Dahra'],
  'Laghouat':['El Beidha','Gueltat Sidi Saad','Brida','Ain Sidi Ali','Tadjemout','Hadj Mechri','Taouiala','El Ghicha','Tadjrouna','Sebgag','Sidi Bouzid','Oued Morra','Laghouat',"Oued M'zi",'Ksar El Hirane','El Assafia','Sidi Makhlouf','Hassi Delaa',"Hassi R'mel",'Ain Madhi','El Haouaita','Kheneg','Benacer Benchohra'],
  'Oum El Bouaghi':['Fkirina','El Fedjoudj Boughrara Sa','Ain Fekroun','Rahia','Meskiana','El Belala','Behir Chergui','Ksar Sbahi','Souk Naamane','Ouled Zouai','Oum El Bouaghi','Ain Babouche','Ain Zitoun','Bir Chouhada','Ain Beida','Berriche','Zorg',"Ain M'lila",'Ouled Gacem','Ouled Hamla','El Amiria','Sigus','Oued Nini','Ain Diss','Dhalaa','El Djazia','Ain Kercha','El Harmilia','Hanchir Toumghani'],
  'Batna':['Maafa','Gosbat','Timgad','Taxlent','Ouled Si Slimane','Lemcene','Talkhamt','Ras El Aioun','Rahbat','Ouled Sellem','Guigba','Teniet El Abed','Batna','Fesdis','Oued Chaaba','Hidoussa','Ksar Bellezma','Merouana','Oued El Ma','Lazrou','Seriana','Zanet El Beida','Menaa','Tigharghar','Ain Yagout','Boumia','Djerma','El Madher','Ouyoun El Assafir','Tazoult','Boumagueur','N Gaous','Sefiane','Arris','Tighanimine','Ain Djasser','El Hassi','Seggana','Tilatou','Foum Toub','Ichemoul','Inoughissen','Bouzina','Larbaa','Boulhilat','Chemora','Bitam','M Doukal','Azil Abedelkader','Djezzar','Ouled Ammar','Ghassira','Kimmel','T Kout','Ain Touta','Beni Foudhala El Hakania','Ouled Fadel','Ouled Aouf','Chir','Oued Taga'],
  'Béjaïa':['Sidi Ayad','Barbacha','Leflaye','Kendira','Sidi-Aich','Tifra','Tinebdar','El Kseur','Fenaia Il Maten','Toudja','Dra El Caid','Kherrata','Bejaia','Oued Ghir','Benimaouche','Beni Djellil','Feraoun','Smaoun','Timezrit','Melbou','Souk El Tenine','Tamridjet','Boukhelifa','Tala Hamza','Tichy',"Ait R'zine",'Ighil-Ali','Ait-Smail','Darguina','Taskriout','Aokas',"Tizi-N'berber",'Adekar',"Beni K'sila",'Taourit Ighil','Akbou','Chellata','Ighram','Tamokra','Amalou','Bouhamza',"M'cisna",'Seddouk','Beni-Mallikeche','Boudjellil','Tazmalt','Akfadou','Chemini','Souk Oufella','Tibane','Ouzellaguen','Amizour'],
  'Biskra':['El Feidh','Lichana','Bouchakroun','Mekhadma','Djemorah','Branis','El Outaya','Khenguet Sidi Nadji','Ain Zaatout','Zeribet El Oued','Meziraa','Biskra','El Hadjab',"M'lili",'Foughala','El Ghrous','Bordj Ben Azzouz','Ourlal','Oumache','Ain Naga','Chetma','El Haouch','Sidi Okba',"M'chouneche",'Lioua','Tolga'],
  'Béchar':['Bechar','Boukais','Lahmar','Mogheul','Meridja','Taghit','Abadla','Erg-Ferradj','Machraa-Houari-Boumediene','Beni-Ounif','Tabelbala','Kenadsa'],
  'Blida':['Beni Mered','Ouled Slama','Mouzaia','Hammam Elouane','Bougara','Souhane','Larbaa','Soumaa','Guerrouaou','Boufarik','Meftah','Chiffa','Ain Romana','Oued  Djer','El-Affroun','Ouled Yaich','Chrea','Djebabra','Oued El Alleug','Benkhelil','Beni-Tamou','Chebli','Bouinan','Bouarfa','Blida'],
  'Bouira':['Ain Laloui','Hadjera Zerga','Mezdour','Taguedite','Ridane','Maamora','El-Hakimia','Ahl El Ksar','Dirah','Dechmia','Bechloul','Ath Mansour','Saharidj','El Adjiba','El Asnam','M Chedallah','Bordj Okhriss','Sour El Ghozlane','Hanif','Chorfa','Ouled Rached','Ain El Hadjar','Aghbalou','Raouraoua','El Khabouzia','Bir Ghbalou','Bouira','Ain Turk','Ait Laaziz','Ain-Bessem','El-Mokrani','Souk El Khemis','Aomar','Djebahia','El Hachimia','Haizer','Taghzout','Bouderbala','Boukram','Guerrouma','Lakhdaria','Maala','Kadiria',"Z'barbar (El Isseri )",'Oued El Berdi'],
  'Tamanrasset':['Tazrouk','Abelsa','Tamanrasset','Ain Amguel','Idles'],
  'Tébessa':['El-Houidjbet','El-Aouinet','Ferkane','Negrine','Bir Mokkadem','Bir Dheheb','Saf Saf El Ouesra','Guorriguer','Bekkaria','Boulhaf Dyr','Oum Ali','Boukhadra','El Malabiod','Ouenza','El Meridj','Ain Zerga','Stah Guentis','El Ogla','El Mezeraa','Bedjene','Morsott','Telidjen','Cheria','El Ogla El Malha','Tebessa','Hammamet','El Kouif'],
  'Tlemcen':['Bab El Assa','Terny Beni Hediel','Mansourah','Beni Mester','Ain Ghoraba','Chetouane','Amieur','Ain Fezza','Honnaine','Beni Khellad','Sidi Djillali','Bouihi','Nedroma',"M'sirda Fouaga","Marsa Ben M'hidi",'Sidi Medjahed','Beni Boussaid','Sebdou','El Gor','Bouhlou','Maghnia','Hammam Boughrara','Zenata','Ouled Riyah','Hennaya','Sidi Abdelli','Souk Tleta','Bensekrane','Fellaoucene','Ain Kebira','Ain Fetah','Tlemcen','Ain Nehala','Ain Tellout','Ain Youcef','Beni Ouarsous','El Fehoul','Remchi','Sebbaa Chioukh','Souani','Sabra','Dar Yaghmoracen','Ghazaouet','Souahlia','Tianet','Beni Smiel','Oued Lakhdar','Ouled Mimoun','Beni Bahdel','Beni Snous','Azail','Djebala'],
  'Tiaret':['Mahdia','Ain Dzarit','Sebaine','Faidja','Si Abdelghani','Sougueur','Tousnina','Meghila','Sebt','Sidi Hosni','Ain El Hadid','Frenda','Takhemaret','Ain Kermes','Djebilet Rosfa','Madna','Medrissa','Sidi Abderrahmane','Guertoufa','Serghine','Zmalet El Emir Abdelkade','Oued Lilli','Sidi Ali Mellal','Djillali Ben Amar','Mechraa Safa','Tagdempt','Bougara','Hamadia','Rechaiga','Tidda','Nadorah','Tiaret','Medroussa','Mellakou','Sidi Bakhti','Ain Deheb','Chehaima','Naima','Ain Bouchekif','Dahmouni','Rahouia'],
  'Tizi Ouzou':['Mizrana','Idjeur','Beni-Douala','Beni-Zikki','Illoula Oumalou','Agouni-Gueghrane','Ait Bouaddou','Ouadhias',"Tizi N'tleta",'Aghribs','Ait-Chafaa','Akerrou','Azeffoun','Iflissen','Tigzirt','Assi-Youcef','Boghni','Bounouh','Mechtras','Draa-Ben-Khedda','Sidi Namane','Tadmait','Tirmitine','Ait Boumahdi','Ait-Toudert','Beni-Aissi','Ouacif','Ait Khellili','Mekla','Souama','Beni-Yenni','Iboudrarene','Tizi-Ouzou','Abi-Youcef','Ain-El-Hammam','Ait-Yahia','Akbil','Boudjima','Makouda','Ain-Zaouia','Ait Yahia Moussa','Draa-El-Mizan','Frikat',"M'kira",'Tizi-Gheniff','Yatafene','Illilten','Imsouhal','Azazga','Freha','Ifigha','Yakourene','Zekri','Ait Aggouacha','Irdjen','Larbaa Nath Irathen','Ait-Oumalou','Tizi-Rached','Ait-Aissa-Mimoun','Ouaguenoun','Timizart','Maatkas','Souk-El-Tenine','Ait-Mahmoud','Beni Zmenzer','Iferhounene','Bouzeguene'],
  'Alger':['Hussein Dey','Les Eucalyptus','Sidi Moussa','Kouba','Mohamed Belouzdad','Ain Taya','Bab Ezzouar','Bordj El Kiffan','Dar El Beida','El Marsa','Mohammadia','Bir Touta','Ouled Chebel','Tessala El Merdja','Herraoua','Reghaia','Rouiba','Maalma','Rahmania','Souidania','Staoueli','Zeralda','Baba Hassen','Douira','Draria','El Achour','Khraissia','Ain Benian','Cheraga','Dely Ibrahim','Hammamet','Ouled Fayet','Alger Centre','El Madania','El Mouradia',"Sidi M'hamed",'Sehaoula','Bologhine Ibnou Ziri','Casbah','Oued Koriche','Rais Hamidou','Bir Mourad Rais','Birkhadem','Djasr Kasentina','Hydra','El Magharia','Ben Aknoun','Beni Messous','Bouzareah','El Biar','Bachedjerah','Bourouba','El Harrach','Oued Smar','Baraki','Bordj El Bahri','Bab El Oued'],
  'Djelfa':['Hassi El Euch','Ain El Ibel','El Guedid','Charef','Benyagoub','Sidi Baizid',"M'liliha",'Dar Chioukh','Taadmit','Had Sahary','Bouira Lahdab','Ain Fekka','Sidi Laadjel','Hassi Fedoul','El Khemis','Selmana','Sed Rahal','Guettara','Deldoul','Zaccar','Douis','El Idrissia','Ain Chouhada','Djelfa','Birine','Oum Laadham','Faidh El Botma','Amourah','Zaafrane','Guernini','Benhar','Ain Maabed','Hassi Bahbah','Moudjebara'],
  'Jijel':['Jijel','El Aouana','Selma Benziada','Erraguene Souissi','Boussif Ouled Askeur','Ziama Mansouriah','Chahna','Emir Abdelkader','Oudjana','Taher','Chekfa','El Kennar Nouchfi','Sidi Abdelaziz','El Milia','Ouled Yahia Khadrouch','Ouled Rabah','Sidi Marouf','Ghebala','Settara','Bouraoui Belhadef','El Ancer','Khiri Oued Adjoul','Djimla','Kaous','Texenna',"Bordj T'har",'Boudria Beniyadjis','Djemaa Beni Habibi'],
  'Sétif':['Rosfa','Oued El Bared',"Tizi N'bechar",'Mezloug','Guellal','Kasr El Abtal','Ouled Si Ahmed','Ait Naoual Mezada','Ait-Tizi','Bouandas','Bousselam','Hamam Soukhna','Taya','Tella','Ain Oulmene','Boutaleb','Hamma','Ouled Tebben','Amoucha','Salah Bey','Ain Azel','Ain Lahdjar','Beidha Bordj','Bir Haddada','Guenzet','Harbil','Ain-Roua','Beni Oussine','El Ouricia','Bougaa','Draa-Kebila','Hammam Guergour','Setif','Ain El Kebira','Dehamcha','Ouled Addouane','Ain-Sebt','Beni-Aziz','Maaouia','Bellaa','Bir-El-Arch','El-Ouldja','Tachouda','Tala-Ifacene','Serdj-El-Ghoul','Guidjel','Ouled Sabor','Bazer-Sakra','El Eulma','Guelta Zerka','Beni Fouda','Djemila','Ain-Legradj','Beni Chebana','Beni Ourtilane','Beni-Mouhli','Ain Abessa','Ain Arnat','Babor','Maouaklane'],
  'Saïda':['Saida','Tircine','Ouled Brahim','Ain Soltane','Maamora','El Hassasna','Ain Sekhouna','Sidi Boubekeur','Ouled Khaled','Hounet','Youb','Doui Thabet','Sidi Ahmed','Moulay Larbi','Ain El Hadjar','Sidi Amar'],
  'Skikda':['Ain Bouziane','Salah Bouchaour','El Hadaiek','Zerdezas','Ouled Habbaba','Beni Oulbane','Sidi Mezghiche','Beni Bechir','Ramdane Djamel','Bin El Ouiden','Emjez Edchich','Tamalous','Ain Kechra','Ouldja Boulbalout','Oum Toub','El Ghedir','Kerkara','El Arrouch','Zitouna','Ouled Attia','Oued Zhour','Collo','Cheraia','Beni Zid','Khenag Maoune','El Marsa','Ben Azzouz','Bekkouche Lakhdar','Es Sebt','Ain Charchar','Azzaba','Bouchetata','Filfila','Hammadi Krouma','Skikda','Ain Zouit','Djendel Saadi Mohamed','Kanoua'],
  'Sidi Bel Abbès':['Sidi Ali Benyoub','Moulay Slissen','El Hacaiba','Ain Tindamine','Tenira','Oued Sefioun','Hassi Dahou','Oued Taourira','Benachiba Chelia','Sidi Yacoub','Sidi Lahcene','Sidi Khaled','Tabia','Sidi Brahim','Amarnas','Boukhanefis','Hassi Zahana','Chetouane Belaila','Ben Badis','Bedrabine El Mokrani','Sfisef',"M'cid",'Boudjebaa El Bordj','Ain- Adden','Sidi Hamadouche','Sidi Chaib','Makedra','Ain El Berd','Redjem Demouche','Ras El Ma','Oued Sebaa','Marhoum','Sidi Bel-Abbes','Ain Thrid','Sehala Thaoura','Tessala','Belarbi','Mostefa  Ben Brahim','Tilmouni','Zerouala','Dhaya','Mezaourou','Teghalimet','Telagh','Ain Kada','Lamtar','Sidi Ali Boussidi','Sidi Dahou Zairs','Bir El Hammam','Merine','Tefessour','Taoudmout'],
  'Annaba':['Annaba','Seraidi','Berrahal','Oued El Aneb','El Hadjar','Sidi Amar','El Bouni','Ain El Berda','Cheurfa','El Eulma','Treat','Chetaibi'],
  'Guelma':['Nechmaya','Bou Hamdane','Hammam Debagh','Roknia','Dahouara',"Hammam N'bail",'Guelma','Boumahra Ahmed','Ain Ben Beida','Bouchegouf','Medjez Sfa','Oued Ferragha','Bouati Mahmoud','El Fedjoudj','Heliopolis','Medjez Amar','Houari Boumedienne','Ras El Agba','Sellaoua Announa','Djeballah Khemissi','Bordj Sabath','Oued Zenati','Ain Regada','Ain Larbi','Ain Makhlouf','Tamlouka','Ain Sandel','Bou Hachana','Khezaras','Belkheir','Beni Mezline','Guelaat Bou Sbaa','Oued Cheham','Bendjarah'],
  'Constantine':['Didouche Mourad','Hamma Bouziane','Beni Hamidane','Zighoud Youcef','Ain Smara','El Khroub','Ouled Rahmoun','Ain Abid','Ben Badis','Ibn Ziad','Messaoud Boudjeriou','Constantine'],
  'Médéa':['Ouled Hellal','Souagui',"M'fatha",'Saneg','El Azizia','Maghraoua','Mihoub','Bouaiche','Boughzoul','Chabounia','Hannacha','Ouamri','Oued Harbil','Beni Slimane','Bouaichoune','Ouled Bouachra','Si Mahdjoub','Bouskene','Sidi Rabie','Berrouaghia','Ouled Deid','Rebaia','Medjebar','Tletat Ed Douair','Zoubiria','Aissaouia','El Haoudane','Mezerana','Tablat','Boghar','Seghouane','Draa Esmar','Medea','Tamesguida','Ben Chicao','El Hamdania','Ouzera','Tizi Mahdi','Ain Boucif','El Ouinet','Kef Lakhdar','Ouled Emaaraf','Sidi Demed','Baata','El Omaria','Ouled Brahim','Bir Ben Laabed','El Guelbelkebir','Sedraya','Ain Ouksir','Chelalet El Adhaoura','Cheniguel','Tafraout','Bouchrahil','Khams Djouamaa','Sidi Naamane','Aziz','Derrag','Oum El Djellil','Djouab','Sidi Zahar','Sidi Ziane','Ouled Antar'],
  'Mostaganem':['Fornaka','Oued El Kheir','Hassiane','Hassi Mameche','Mazagran','Stidia','Ain-Tedles','Sidi Belaattar','Sour','Ain-Boudinar','Kheir-Eddine','Sayada','Sidi Ali','Tazgait','Benabdelmalek Ramdane','Mostaganem','Hadjadj','Sidi-Lakhdar','Achaacha','Khadra','Nekmaria','Ouled Boughalem','Bouguirat','Safsaf','Sirat','Souaflia','Ain-Sidi Cherif','Mansourah','Mesra','Touahria','Ain-Nouissy','Ouled-Maalah'],
  "M'Sila":['Chellal','Ouled Madhi','Khettouti Sed-El-Jir','Belaiba','Berhoum','Dehahna','Magra','Beni Ilmane','Bouti Sayeh','Sidi Aissa','Ain El Hadjel','Sidi Hadjeres','El Hamel','Oulteme','Benzouh','Ouled Sidi Brahim','Sidi Ameur','Tamsa','Ben Srour','Mohamed Boudiaf','Ouled Slimane','Zarzour','Ain El Melh','Ain Fares','Ain Rich','Bir Foda',"Sidi M'hamed",'Medjedel','Menaa','Djebel Messaad','Slim',"M'sila",'Hammam Dalaa','Ouanougha','Ouled Mansour','Tarmount','Maadid',"M'tarfa",'Maarif','Ouled Derradj','Souamaa','El Houamed','Khoubana',"M'cif",'Ain Khadra','Ouled Addi Guebala'],
  'Mascara':['Oued El Abtal','Sidi Abdelmoumene','Sedjerara','Mohammadia','Tighennif','Mocta-Douz','Ferraguig','El Ghomri','Zahana','El Gaada','Ras El Ain Amirouche','Oggaz','Alaimia','Sig','Chorfa','Bou Henni','El Mamounia','El Gueitena','Ain Fares','Gharrous','Benian','Aouf','Guerdjoum','Ain Frass','Ain Fekan','Khalouia','El Menaouer','El Bordj','Sidi Boussaid','Matemore','Sidi Kada','Makhda','Mascara','Bouhanifia','Ghriss','Hacine','El Keurt','Froha','Tizi','Sehailia','Maoussa','Sidi Abdeldjebar','El Hachem','Nesmot','Zelamta','Ain Ferah','Oued Taria'],
  'Ouargla':['Ouargla','Hassi Messaoud','Ain Beida','Hassi Ben Abdellah','Sidi Khouiled','El Borma','Rouissat',"N'goussa"],
  'Oran':['Sidi Chami','Hassi Mefsoukh','Bir El Djir','Hassi Ben Okba','Gdyel','Hassi Bounif','El Kerma','Es Senia','Ben Freha','Arzew','Sidi Ben Yebka','Ain Biya','Bethioua','Marsat El Hadjadj','Ain Turk','Oran','El Ancor','Mers El Kebir','Boufatis','El Braya','Oued Tlelat','Ain Kerma','Boutlelis','Messerghin','Bousfer','Tafraoui'],
  'El Bayadh':['Ain El Orak','Krakda','Sidi Slimane','Sidi Ameur','Boualem','El Bnoud','Bougtoub','El Kheiter','Tousmouline','Sidi Tiffour','Stitten','El Bayadh','Rogassa','El Mehara','Kef El Ahmar','Brezina','Ghassoul','Boussemghoun','Cheguig','Chellala','Arbaouat'],
  'Illizi':['Bordj Omar Driss','Debdeb','In Amenas','Illizi'],
  'Bordj Bou Arreridj':['Elhammadia','Ouled Sidi-Brahim','Ain Taghrout','Tixter','Belimour','El Annasseur','Ghailasa','Taglait','Bordj Ghedir','El Euch','Sidi-Embarek','Khelil','Bir Kasdali','Tefreg','El Main','Djaafra','Colla','Teniet En Nasr',"El M'hir",'Ksour','Mansoura','Haraza','Rabta','El Achir','Hasnaoua','Medjana','Ain Tesra','Ouled Brahem','Ras El Oued','Bordj Zemmoura','Ouled Dahmane','Tassamert','B. B. Arreridj','Ben Daoud'],
  'Boumerdès':['El Kharrouba','Dellys','Ben Choud','Afir','Thenia','Beni Amrane','Khemis El Khechna','Ammal','Timezrit','Zemmouri','Larbatache','Isser','Chabet El Ameur','Ouled Aissa','Naciria','Bouzegza Keddara','Souk El Had','Sidi Daoud','Baghlia','Leghata','Djinet','Tidjelabine','Si Mustapha','Ouled Hedadj','Ouled Moussa','Boumerdes','Corso','Bordj Menaiel','Boudouaou','Boudouaou El Bahri','Taourga','Hammedi'],
  'El Tarf':['Ain El Assel','Bougous','El Tarf','Zitouna','Besbes','Ain Kerma','Bouhadjar','Hammam Beni Salah','Oued Zitoun','Ben M Hidi','Berrihane','Chebaita Mokhtar','Echatt','El Aioun','El Kala','Souarekh','Zerizer','Bouteldja','Chefia','Lac Des Oiseaux','Chihani','Raml Souk','Asfour','Drean'],
  'Tindouf':['Tindouf','Oum El Assel'],
  'Tissemsilt':['Khemisti','Theniet El Had','Ouled Bessam','Sidi Boutouchent','Tissemsilt','Sidi Lantri','Beni Chaib','Beni Lahcene','Sidi Abed','Sidi Slimane','Boucaid','Larbaa','Lazharia','Lardjem','Melaab','Layoune','Tamellahet','Youssoufia','Bordj El Emir Abdelkader','Ammari','Maacem','Bordj Bounaama'],
  'El Oued':['Douar El Maa','El Ogla','Magrane','Sidi Aoun','Mih Ouansa','Kouinine','Bayadha','Nakhla','Robbah','Guemar','Ben Guecha','Ourmes','Taghzout','Hamraia','Reguiba','Debila','Hassani Abdelkrim','Hassi Khalifa','Trifaoui','Taleb Larbi','Oued El Alenda','El-Oued'],
  'Khenchela':['Khirane','Babar','El Mahmal','Ouled Rechache','Djellal','Yabous','Khenchela','Kais','Chelia','Remila','Taouzianat','Baghai','El Hamma','Ensigha','Tamza','Ain Touila',"M'toussa",'Bouhmama','El Oueldja',"M'sara",'Chechar'],
  'Souk Ahras':['Souk Ahras','Ain Soltane','Sedrata','Hanencha','Machroha','Ain Zana','Ouled Driss','Terraguelt','Oum El Adhaim','Oued Kebrit','Tiffech','Ragouba','Drea','Taoura','Zaarouria','Haddada','Khedara','Ouled Moumen','Merahna','Ouillen','Sidi Fredj','Bir Bouhouche','Safel El Ouiden','Khemissa',"M'daourouche",'Zouabi'],
  'Tipaza':['Hadjout','Merad','Menaceur','Aghbal','Nador','Sidi-Amar','Gouraya','Messelmoun','Cherchell','Hadjret Ennous','Sidi Ghiles','Damous','Larhat','Fouka','Ain Tagourait','Bou Haroun','Bou Ismail','Khemisti','Ahmer El Ain','Bourkika','Douaouda','Sidi Rached','Attatba','Chaiba','Kolea','Sidi Semiane','Tipaza','Beni Mileuk'],
  'Mila':['El Mechira','El Ayadi Barbes','Ain Beida Harriche','Tassala Lematai','Terrai Bainen','Amira Arres','Tassadane Haddada','Minar Zarza','Sidi Merouane','Chigara','Hamala','Grarem Gouga','Tiberguent','Rouached','Derrahi Bousselah','Zeghaia','Oued Endja','Ahmed Rachedi','Tadjenanet','Ain Mellouk','Ouled Khalouf','Benyahia Abderrahmane','Teleghma','Oued Seguen','Oued Athmenia','Ain Tine','Chelghoum Laid','Yahia Beniguecha','Ferdjioua','Sidi Khelifa','Mila','Bouhatem'],
  'Aïn Defla':['Khemis-Miliana','Sidi-Lakhdar','Ain-Benian','Ain-Torki','Hammam-Righa','Bourached','Hoceinia','Djelida','Arib','Djemaa Ouled Cheikh','El-Amra','El-Attaf','Tiberkanine','Ain-Bouyahia','El-Abadia','Tacheta Zegagha','Birbouche','Djendel','Ben Allal','Oued Chorfa','Boumedfaa','Ain-Lechiakh','Ain-Soltane','Oued Djemaa','El-Maine','Rouina','Zeddine','Bir-Ould-Khelifa','Bordj-Emir-Khaled','Tarik-Ibn-Ziad','Bathia','Belaas','Hassania','Ain-Defla','Miliana','Mekhatria'],
  'Naâma':['Tiout','Moghrar','Asla','Kasdir','Makmen Ben Amar','Ain Sefra','Mecheria','El Biodh','Ain Ben Khelil','Naama','Djenienne Bourezg','Sfissifa'],
  'Aïn Témouchent':['Sidi Boumediene','Tamzoura','Chaabat El Ham','El Maleh','Ouled Kihal','Chentouf','Terga','Oued Sebbah','El Amria','Hassi El Ghella','Ouled Boudjemaa','Aghlal','Ain Kihal','Ain Tolba','Aoubellil','Beni Saf','Hassasna','Emir Abdelkader','Sidi Safi','Oulhaca El Gheraba','Sidi Ouriache','Ain El Arbaa','El Messaid','Oued Berkeche','Sidi Ben Adda','Ain Temouchent','Bouzedjar','Hammam Bou Hadjar'],
  'Ghardaïa':['Dhayet Bendhahoua','Mansoura','El Atteuf','Bounoura','Zelfana','El Guerrara','Sebseb','Metlili','Berriane','Ghardaia'],
  'Relizane':['El-Guettar','Ouled Aiche','Beni Dergoun','Dar Ben Abdelah','Zemmoura','Djidiouia','Hamri','Belaassel Bouzagza','El-Matmar','Sidi Khettab',"Sidi M'hamed Benaouda",'Ain-Tarek','Had Echkalla','El Ouldja','Mazouna','Ain Rahma','Kalaa','Sidi Saada','Yellel','Souk El Had','Mendes','Oued Essalem','Sidi Lazreg','Ammi Moussa','Ouarizane','Merdja Sidi Abed','Ouled Sidi Mihoub','Bendaoud','Oued-Rhiou','El Hassi',"Sidi M'hamed Benali",'Mediouna','Beni Zentis','Oued El Djemaa','Lahlef','Relizane',"El H'madna",'Ramka'],
  'Timimoun':['Tinerkouk','Timimoun','Ouled Said','Metarfa','Talmine','Ouled Aissa','Charouine','Aougrout','Deldoul','Ksar Kaddour'],
  'Bordj Badji Mokhtar':['Timiaouine','Bordj Badji Mokhtar'],
  'Ouled Djellal':['Ras El Miad','Besbes','Sidi Khaled','Doucen','Chaiba','Ouled Djellal'],
  'Béni Abbès':['Beni-Abbes','Tamtert','Igli','El Ouata','Ouled-Khodeir','Kerzaz','Timoudi','Ksabi','Beni-Ikhlef'],
  'In Salah':['Inghar','Ain Salah','Foggaret Ezzoua'],
  'In Guezzam':['Tin Zouatine','Ain Guezzam'],
  'Touggourt':['Temacine','Sidi Slimane','Megarine','Nezla','Blidet Amor','Tebesbest','Touggourt','Taibet','El Alia','El-Hadjira','Benaceur',"M'naguer",'Zaouia El Abidia'],
  'Djanet':['Djanet','Bordj El Haouass'],
  'El Meghaier':['Oum Touyour','Sidi Amrane',"M'rara",'Djamaa','Tenedla',"El-M'ghaier",'Still','Sidi Khelil'],
  'El Menia':['El Meniaa','Hassi Gara','Hassi Fehal'],
  'Aflou':['Aflou','Sebgag','Sidi Bouzid'],
  'Barika':['Barika',"M'doukel",'Bitam'],
  'Ksar Chellala':['Ksar Chellala','Serghine','Zmalet El Emir Abdelkader'],
  'Messaad':['Messaad','Deldoul','Selmana','Sed Rahal','Guettara'],
  'Aïn Oussera':['Aïn Oussera','Guernini'],
  'Boussaâda':['Boussaâda','El Hamel','Oultem'],
  'El Abiodh Sidi Cheikh':['El Abiodh Sidi Cheikh'],
  'El Kantara':['El Kantara','Aïn Zaatout'],
  'Bir El Ater':['Bir El Ater','Ogla Melha'],
  'Ksar El Boukhari':['Ksar El Boukhari','Meftaha','Saneg'],
  'El Aricha':['El Aricha','El Gor'],
};

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json();
}

// ─── Status / Role colors ─────────────────────────────────────────────────────
const STATUS_COLORS = {
  actif:    { bg: 'rgba(0,201,167,0.12)',  color: '#00C9A7', border: 'rgba(0,201,167,0.25)' },
  inactif:  { bg: 'rgba(122,139,173,0.1)', color: '#7A8BAD', border: 'rgba(122,139,173,0.2)' },
  suspendu: { bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', border: 'rgba(255,107,107,0.22)' },
};
const ROLE_COLORS = {
  medecin:    { bg: 'rgba(74,108,247,0.1)',  color: '#4A6CF7' },
  epidimio:   { bg: 'rgba(255,205,86,0.12)', color: '#F4D03F' },
  anapate:    { bg: 'rgba(155,89,182,0.12)', color: '#9B59B6' },
  pharmacie:  { bg: 'rgba(52,152,219,0.12)', color: '#3498DB' },
};
const ALL_PERMISSIONS = [
  { key: 'perm_read',   label: 'Lecture',      icon: '👁',  desc: 'Consulter les dossiers patients' },
  { key: 'perm_write',  label: 'Écriture',     icon: '✏',  desc: 'Créer / modifier des dossiers' },
  { key: 'perm_rcp',    label: 'RCP',          icon: '💬', desc: 'Participer aux réunions RCP' },
  { key: 'perm_lab',    label: 'Laboratoire',  icon: '🔬', desc: 'Accès aux données biologiques' },
  { key: 'perm_stats',  label: 'Statistiques', icon: '📊', desc: 'Voir les tableaux de bord' },
  { key: 'perm_import', label: 'Import',       icon: '📥', desc: 'Importer des données CSV/Excel' },
];

// ─── User Modal ───────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const isNew = !user;
  const [form, setForm] = useState(
    // ✅ بعد
    user
      ? { ...user, password: '', password2: '', commune: user.commune || '' }
      : {
          nom: '', prenom: '', email: '', role: 'medecin',
          specialite: '', wilaya: '', commune: '', etablissement: '',
          statut: 'actif', telephone: '',
          perm_read: true, perm_write: false, perm_rcp: false,
          perm_lab: false, perm_stats: false, perm_import: false,
          password: '', password2: '',
        }
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const togglePerm = (key) => setForm(prev => ({ ...prev, [key]: !prev[key] }));

  const validate = () => {
    const e = {};
    if (!form.nom.trim())    e.nom    = 'Obligatoire';
    if (!form.prenom.trim()) e.prenom = 'Obligatoire';
    if (!form.email.trim())  e.email  = 'Obligatoire';
    if (isNew) {
      if (!form.password)         e.password  = 'Le mot de passe est obligatoire';
      else if (form.password.length < 8) e.password = 'Minimum 8 caractères';
      if (form.password !== form.password2) e.password2 = 'Les mots de passe ne correspondent pas';
    } else if (form.password && form.password !== form.password2) {
      e.password2 = 'Les mots de passe ne correspondent pas';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = { ...form };
    delete payload.password2;
    if (!payload.password) delete payload.password; // don't send empty password on edit
    try {
      await onSave(payload);
    } catch (err) {
      const apiErrors = {};
      if (err.email) apiErrors.email = err.email[0];
      if (err.password) apiErrors.password = err.password[0];
      if (err.non_field_errors) apiErrors.general = err.non_field_errors[0];
      setErrors(apiErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.modalOverlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>
            <div style={s.modalIcon}>{isNew ? '➕' : '✏'}</div>
            {isNew ? 'Créer un utilisateur' : `Modifier — ${user.prenom} ${user.nom}`}
          </div>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div style={s.modalBody}>
          {errors.general && (
            <div style={s.errBanner}>⚠ {errors.general}</div>
          )}

          {/* Identité */}
          <div style={s.modalSection}>
            <div style={s.modalSectionLabel}>Identité</div>
            <div style={s.modalGrid2}>
              <div style={s.mfg}>
                <label style={s.ml}>Nom *</label>
                <input style={{ ...s.mi, ...(errors.nom ? s.miErr : {}) }}
                  value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom de famille" />
                {errors.nom && <span style={s.errTxt}>{errors.nom}</span>}
              </div>
              <div style={s.mfg}>
                <label style={s.ml}>Prénom *</label>
                <input style={{ ...s.mi, ...(errors.prenom ? s.miErr : {}) }}
                  value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" />
                {errors.prenom && <span style={s.errTxt}>{errors.prenom}</span>}
              </div>
            </div>
            <div style={s.mfg}>
              <label style={s.ml}>Email professionnel *</label>
              <input style={{ ...s.mi, ...(errors.email ? s.miErr : {}) }}
                type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="exemple@hopital.dz" />
              {errors.email && <span style={s.errTxt}>{errors.email}</span>}
            </div>
            <div style={{ ...s.mfg, marginTop: 12 }}>
              <label style={s.ml}>Téléphone</label>
              <input style={s.mi} value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                placeholder="0770 123 456" />
            </div>
          </div>

          {/* Mot de passe */}
          <div style={s.modalSection}>
            <div style={s.modalSectionLabel}>
              {isNew ? 'Mot de passe *' : 'Changer le mot de passe (optionnel)'}
            </div>
            <div style={s.modalGrid2}>
              <div style={s.mfg}>
                <label style={s.ml}>{isNew ? 'Mot de passe *' : 'Nouveau mot de passe'}</label>
                <input style={{ ...s.mi, ...(errors.password ? s.miErr : {}) }}
                  type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={isNew ? 'Minimum 8 caractères' : 'Laisser vide pour ne pas changer'} />
                {errors.password && <span style={s.errTxt}>{errors.password}</span>}
              </div>
              <div style={s.mfg}>
                <label style={s.ml}>Confirmer *</label>
                <input style={{ ...s.mi, ...(errors.password2 ? s.miErr : {}) }}
                  type="password" value={form.password2}
                  onChange={e => setForm({ ...form, password2: e.target.value })}
                  placeholder="Répéter le mot de passe" />
                {errors.password2 && <span style={s.errTxt}>{errors.password2}</span>}
              </div>
            </div>
          </div>

          {/* Rôle & Profil */}
          <div style={s.modalSection}>
            <div style={s.modalSectionLabel}>Rôle & Profil</div>
            <div style={s.modalGrid2}>
              <div style={s.mfg}>
                <label style={s.ml}>Rôle</label>
                <select style={s.mi} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="medecin">Médecin</option>
                  <option value="epidimio">Épidimio</option>
                  <option value="anapate">Anapath</option>
                  <option value="pharmacie">Pharmacie</option>
                </select>
              </div>
              <div style={s.mfg}>
                <label style={s.ml}>Spécialité</label>
                <input style={s.mi} value={form.specialite}
                  onChange={e => setForm({ ...form, specialite: e.target.value })} placeholder="ex: Oncologie" />
              </div>
            </div>
            <div style={s.modalGrid2}>
              {/* استبدل هذا الـ div الخاص بـ Wilaya */}
<div style={s.mfg}>
  <label style={s.ml}>Wilaya</label>
  <select
    style={s.mi}
    value={form.wilaya}
    onChange={e => setForm({ ...form, wilaya: e.target.value, commune: '' })}
  >
    <option value="">— Choisir une wilaya —</option>
    {Object.keys(WILAYAS_COMMUNES).map(w => (
      <option key={w} value={w}>{w}</option>
    ))}
  </select>
</div>

{/* أضف حقل البلدية بعده مباشرة */}
<div style={s.mfg}>
  <label style={s.ml}>Commune</label>
  <select
    style={{ ...s.mi, opacity: form.wilaya ? 1 : 0.5 }}
    value={form.commune || ''}
    onChange={e => setForm({ ...form, commune: e.target.value })}
    disabled={!form.wilaya}
  >
    <option value="">— Choisir une commune —</option>
    {(WILAYAS_COMMUNES[form.wilaya] || []).map(c => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>
</div>
              <div style={s.mfg}>
                <label style={s.ml}>Établissement</label>
                <input style={s.mi} value={form.etablissement}
                  onChange={e => setForm({ ...form, etablissement: e.target.value })} placeholder="CHU / EHU…" />
              </div>
            </div>
            <div style={{ ...s.mfg, marginTop: 12 }}>
              <label style={s.ml}>Statut du compte</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {['actif', 'inactif', 'suspendu'].map(st => (
                  <button key={st} type="button"
                    style={{ ...s.statusToggle, ...(form.statut === st ? s.statusToggleActive : {}) }}
                    onClick={() => setForm({ ...form, statut: st })}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div style={s.modalSection}>
            <div style={s.modalSectionLabel}>Permissions d'accès</div>
            <div style={s.permGrid}>
              {ALL_PERMISSIONS.map(({ key, label, icon, desc }) => {
                const active = !!form[key];
                return (
                  <div key={key}
                    style={{ ...s.permCard, ...(active ? s.permCardActive : {}) }}
                    onClick={() => togglePerm(key)}>
                    <div style={s.permIcon}>{icon}</div>
                    <div style={s.permLabel}>{label}</div>
                    <div style={s.permDesc}>{desc}</div>
                    <div style={{ ...s.permCheck, ...(active ? s.permCheckActive : {}) }}>{active ? '✓' : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={s.modalFooter}>
          <button style={s.btnGhost} onClick={onClose} disabled={loading}>Annuler</button>
          <button style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Chargement…' : isNew ? '✓ Créer l\'utilisateur' : '✓ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
function UsersPage({ search }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/users/');
      setUsers(Array.isArray(data) ? data : (data.results || []));
    } catch {
      showToast('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const handleSave = async (formData) => {
    if (editUser) {
      const updated = await apiFetch(`/users/${editUser.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u));
      showToast(`✓ Utilisateur ${formData.prenom} ${formData.nom} modifié`);
    } else {
      const created = await apiFetch('/users/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setUsers(prev => [created, ...prev]);
      showToast(`✓ Compte créé — ${formData.prenom} ${formData.nom} peut maintenant se connecter`);
    }
    setShowModal(false);
    setEditUser(null);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le compte de ${name} ?`)) return;
    try {
      await apiFetch(`/users/${id}/`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast(`✓ Compte supprimé`);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email} ${u.role} ${u.wilaya} ${u.etablissement}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast.msg && (
        <div style={{ ...s.toast, background: toast.type === 'error' ? 'linear-gradient(135deg,#FF6B6B,#e74c3c)' : 'linear-gradient(135deg,#00C9A7,#00a98b)' }}>
          {toast.msg}
        </div>
      )}
      {(showModal || editUser) && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={handleSave}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={s.pageTitle}>
          Mes utilisateurs
          <span style={s.pageTitleCount}>{filtered.length} compte{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <button style={s.btnPrimary} onClick={() => setShowModal(true)}>➕ Nouvel utilisateur</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#7A8BAD' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Chargement des utilisateurs…
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Utilisateur', 'Rôle', 'Spécialité', 'Établissement', 'Permissions', 'Statut', 'Créé le', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                  <td style={s.td}>
                    <div style={s.patientCell}>
                      <div style={{
                        ...s.patientAvatar,
                        background: ROLE_COLORS[u.role]?.bg || '#eee',
                        color: ROLE_COLORS[u.role]?.color || '#555'
                      }}>
                        {(u.prenom?.[0] || '?')}{(u.nom?.[0] || '?')}
                      </div>
                      <div>
                        <div style={s.patientName}>{u.prenom} {u.nom}</div>
                        <div style={{ fontSize: 11, color: '#7A8BAD', fontWeight: 600 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.roleChip, ...ROLE_COLORS[u.role] }}>
                      {{
                        medecin:   'Médecin',
                        epidimio:  'Épidimio',
                        anapate:   'Anapath',
                        pharmacie: 'Pharmacie',
                      }[u.role] || u.role}
                    </span>
                  </td>
                  <td style={s.td}><span style={{ fontSize: 13, color: '#4A5568' }}>{u.specialite || '—'}</span></td>
                  <td style={s.td}>
                    <div style={{ fontSize: 12, color: '#4A6CF7', fontWeight: 700 }}>{u.etablissement || '—'}</div>
                    <div style={{ fontSize: 11, color: '#7A8BAD' }}>{u.wilaya || '—'}{u.commune ? ` · ${u.commune}` : ''}</div>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {ALL_PERMISSIONS.filter(p => u[p.key]).map(p => (
                        <span key={p.key} style={s.permBadge} title={p.desc}>{p.icon} {p.label}</span>
                      ))}
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.statusBadge, ...(STATUS_COLORS[u.statut] || STATUS_COLORS.inactif) }}>
                      {u.statut?.charAt(0).toUpperCase() + u.statut?.slice(1)}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 12, color: '#7A8BAD', fontWeight: 600 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={s.actionBtns}>
                      <button style={s.iconBtnBlue} title="Modifier" onClick={() => setEditUser(u)}>✏</button>
                      <button style={{ ...s.iconBtnBlue, color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)' }}
                        title="Supprimer" onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#7A8BAD', padding: 50 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
                    <div style={{ fontWeight: 700 }}>Aucun utilisateur créé</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Cliquez sur « Nouvel utilisateur » pour commencer</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Logs Page ────────────────────────────────────────────────────────────────
function LogsPage({ search }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiFetch('/logs/')
      .then(data => setLogs(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs
    .filter(l => filter === 'all' || l.action === filter)
    .filter(l => `${l.user_name} ${l.action} ${l.detail}`.toLowerCase().includes(search.toLowerCase()));

  const logStyle = (action) => ({
    login:  { bg: 'rgba(0,201,167,0.1)',  color: '#00C9A7', icon: '🔑' },
    logout: { bg: 'rgba(74,108,247,0.1)', color: '#4A6CF7', icon: '🚪' },
    action: { bg: 'rgba(255,162,107,0.1)', color: '#FFA26B', icon: '⚡' },
  }[action] || { bg: '#eee', color: '#666', icon: '•' });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={s.pageTitle}>
          Journal d'activité
          <span style={s.pageTitleCount}>{filtered.length} événements</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all', 'Tout'], ['login', 'Connexions'], ['logout', 'Déconnexions'], ['action', 'Actions']].map(([val, label]) => (
            <button key={val}
              style={{ ...s.filterBtn, ...(filter === val ? s.filterBtnActive : {}) }}
              onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#7A8BAD' }}>⏳ Chargement…</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Utilisateur', 'Type', 'Action', 'Détail', 'Horodatage'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const ls = logStyle(l.action);
                return (
                  <tr key={l.id} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                    <td style={s.td}>
                      <div style={s.patientCell}>
                        <div style={{ ...s.patientAvatar, background: ls.bg, color: ls.color, fontSize: 14 }}>{ls.icon}</div>
                        <span style={s.patientName}>{l.user_name}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{ padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 800, background: ls.bg, color: ls.color }}>
                        {ls.icon} {l.action === 'login' ? 'Connexion' : l.action === 'logout' ? 'Déconnexion' : 'Action'}
                      </span>
                    </td>
                    <td style={s.td}><span style={{ fontWeight: 700, color: '#1A2B4A', fontSize: 13 }}>{l.action}</span></td>
                    <td style={s.td}><span style={{ fontSize: 12, color: '#7A8BAD', fontWeight: 600 }}>{l.detail || '—'}</span></td>
                    <td style={s.td}>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, color: '#4A6CF7' }}>
                        {new Date(l.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#7A8BAD', padding: 40 }}>Aucun journal trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Overview Page ────────────────────────────────────────────────────────────
function OverviewPage({ usersCount, logsCount, setPage }) {
  return (
    <>
      <div style={s.statsGrid}>
        {[
          { label: 'Mes utilisateurs', value: String(usersCount), delta: 'médecins, épidimio, anapath, pharmacie', icon: '👥', color: '#4A6CF7' },
          { label: 'Activités enregistrées', value: String(logsCount), delta: 'dans le journal', icon: '📋', color: '#00C9A7' },
          { label: 'Statut système', value: 'En ligne', delta: 'Backend connecté', icon: '✅', color: '#9B59B6' },
        ].map(({ label, value, delta, icon, color }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: color + '18', color }}>{icon}</div>
            <div style={s.statInfo}>
              <div style={s.statValue}>{value}</div>
              <div style={s.statLabel}>{label}</div>
              <div style={{ ...s.statDelta, color }}>{delta}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.sectionHeader}>
        <div style={s.sectionTitle}>Navigation rapide</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { id: 'users', icon: '👤', label: 'Gérer mes utilisateurs', sub: 'Créer des comptes médecins, épidimio, anapath & pharmacie', color: 'linear-gradient(135deg,#4A6CF7,#6B87FF)' },
          { id: 'logs',  icon: '📋', label: 'Journal d\'activité',     sub: 'Connexions & actions des utilisateurs',  color: 'linear-gradient(135deg,#9B59B6,#8e44ad)' },
        ].map(({ id, icon, label, sub, color }) => (
          <div key={id} style={s.quickCard} onClick={() => setPage(id)}>
            <div style={{ ...s.quickIcon, background: color }}>{icon}</div>
            <div style={s.quickLabel}>{label}</div>
            <div style={s.quickSub}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div style={s.infoBanner}>
        <div style={{ fontSize: 22, marginBottom: 10 }}>💡</div>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          Comment ça marche ?
        </div>
        <div style={{ fontSize: 13, color: '#7A8BAD', lineHeight: 1.6 }}>
          1. Créez un compte pour chaque médecin, épidimio, anapath ou pharmacie via <strong>« Gérer mes utilisateurs »</strong><br />
          2. Définissez un <strong>email</strong> et un <strong>mot de passe</strong> sécurisé<br />
          3. Assignez les <strong>permissions</strong> adaptées à leur rôle<br />
          4. L'utilisateur peut maintenant se connecter avec ses identifiants
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState('overview');
  const [search, setSearch] = useState('');
  const [usersCount, setUsersCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);

  // Load counts for overview
  useEffect(() => {
    apiFetch('/users/').then(d => setUsersCount((Array.isArray(d) ? d : d.results || []).length)).catch(() => {});
    apiFetch('/logs/').then(d => setLogsCount((Array.isArray(d) ? d : d.results || []).length)).catch(() => {});
  }, []);

  const navItems = [
    { id: 'overview',      icon: '🏠', label: 'Vue d\'ensemble' },
    { id: 'users',         icon: '👤', label: 'Mes utilisateurs' },
    { id: 'custom-fields', icon: '🎛️', label: 'Champs personnalisés' },
    { id: 'logs',          icon: '📋', label: 'Journal' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <div style={s.root}>
      {/* ── SIDEBAR ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarBrand}>
          <div style={s.brandIcon}>⚕</div>
          <div>
            <span style={s.brandName}>MedDossier</span>
            <div style={s.brandSub}>Administration</div>
          </div>
        </div>

        <nav style={s.nav}>
          {navItems.map(({ id, icon, label }) => (
            <button key={id}
              style={{ ...s.navItem, ...(page === id ? s.navActive : {}) }}
              onClick={() => { setPage(id); setSearch(''); }}>
              <span style={s.navIcon}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.adminBadge}>⚙ Administrateur</div>
          <div style={s.userCard}>
            <div style={s.userAvatar}>AD</div>
            <div>
              <div style={s.userName}>Administrateur</div>
              <div style={s.userRole}>Registre National</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>⬅ Déconnexion</button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={s.main}>
        {/* TOPBAR */}
        <div style={s.topbar}>
          <div>
            <div style={s.topbarTitle}>
              {page === 'overview' && 'Tableau de bord Admin'}
              {page === 'users'    && 'Gestion des utilisateurs'}
              {page === 'custom-fields' && 'Champs personnalisés'}
              {page === 'logs'     && 'Journal d\'activité'}
            </div>
            <div style={s.topbarSub}>Registre National du Cancer — Panel Administrateur</div>
          </div>
          <div style={s.topbarRight}>
            {page !== 'overview' && (
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input style={s.searchInput} type="text"
                  placeholder="Rechercher…" value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
            )}
            <div style={s.avatar}>AD</div>
          </div>
        </div>

        {page === 'overview' && <OverviewPage usersCount={usersCount} logsCount={logsCount} setPage={setPage} />}
        {page === 'users'    && <UsersPage search={search} />}
        {page === 'custom-fields' && <CustomFieldsPage search={search} />}
        {page === 'logs'     && <LogsPage search={search} />}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: { display: 'flex', minHeight: '100vh', fontFamily: "'Nunito', sans-serif", background: '#EEF2FF' },
  sidebar: { width: 250, flexShrink: 0, background: 'linear-gradient(170deg, #1a2f6b 0%, #0f1c3f 100%)', display: 'flex', flexDirection: 'column', padding: '28px 16px', position: 'sticky', top: 0, height: '100vh' },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  brandIcon: { width: 38, height: 38, background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', boxShadow: '0 5px 15px rgba(74,108,247,0.5)' },
  brandName: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff', display: 'block' },
  brandSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, border: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: '0.2s', textAlign: 'left', width: '100%' },
  navActive: { background: 'rgba(74,108,247,0.3)', color: '#fff', fontWeight: 800, boxShadow: '0 2px 12px rgba(74,108,247,0.25)' },
  navIcon: { fontSize: 17, width: 20, textAlign: 'center' },
  sidebarBottom: { display: 'flex', flexDirection: 'column', gap: 8 },
  adminBadge: { padding: '6px 14px', background: 'rgba(155,89,182,0.25)', borderRadius: 8, fontSize: 11, fontWeight: 800, color: '#c39bd3', letterSpacing: '0.5px', textAlign: 'center' },
  userCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#9B59B6,#c39bd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 },
  userName: { fontSize: 13, fontWeight: 800, color: '#fff' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
  logoutBtn: { padding: '9px 14px', background: 'rgba(255,107,107,0.15)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  topbarTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A2B4A' },
  topbarSub: { fontSize: 13, color: '#7A8BAD', fontWeight: 600, marginTop: 2 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#7A8BAD' },
  searchInput: { background: '#fff', border: '1.5px solid #DDE4F3', borderRadius: 30, padding: '10px 16px 10px 38px', fontSize: 13, fontFamily: "'Nunito', sans-serif", color: '#1A2B4A', outline: 'none', width: 260 },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#9B59B6,#c39bd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 14px rgba(155,89,182,0.3)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 },
  statCard: { background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 4px 20px rgba(74,108,247,0.08)', display: 'flex', alignItems: 'center', gap: 16, border: '1.5px solid #EEF2FF' },
  statIcon: { width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  statInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  statValue: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A2B4A' },
  statLabel: { fontSize: 12, color: '#7A8BAD', fontWeight: 600 },
  statDelta: { fontSize: 11, fontWeight: 800, marginTop: 2 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#1A2B4A' },
  quickCard: { background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1.5px solid #EEF2FF', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: '0.22s', boxShadow: '0 4px 14px rgba(74,108,247,0.06)' },
  quickIcon: { width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', boxShadow: '0 6px 16px rgba(0,0,0,0.2)' },
  quickLabel: { fontSize: 14, fontWeight: 800, color: '#1A2B4A' },
  quickSub: { fontSize: 12, color: '#7A8BAD', fontWeight: 600 },
  infoBanner: { background: 'linear-gradient(135deg,rgba(74,108,247,0.05),rgba(0,201,167,0.03))', border: '1.5px solid rgba(74,108,247,0.15)', borderRadius: 16, padding: '24px 28px' },
  pageTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#1A2B4A', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 10 },
  pageTitleCount: { fontSize: 13, fontWeight: 700, color: '#7A8BAD', background: '#EEF2FF', padding: '3px 10px', borderRadius: 20 },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(74,108,247,0.08)', border: '1.5px solid #EEF2FF' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F5F8FF' },
  th: { padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#7A8BAD', textTransform: 'uppercase', letterSpacing: '0.9px', borderBottom: '1.5px solid #EEF2FF', whiteSpace: 'nowrap' },
  tr: { transition: '0.15s' },
  td: { padding: '13px 16px', fontSize: 13, color: '#1A2B4A', fontWeight: 600, borderBottom: '1px solid #EEF2FF' },
  patientCell: { display: 'flex', alignItems: 'center', gap: 10 },
  patientAvatar: { width: 34, height: 34, borderRadius: '50%', background: 'rgba(74,108,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A6CF7', fontWeight: 800, fontSize: 11, flexShrink: 0 },
  patientName: { fontWeight: 700, color: '#1A2B4A', fontSize: 13 },
  statusBadge: { padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 800, border: '1.5px solid' },
  roleChip: { padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 800 },
  permBadge: { padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(74,108,247,0.08)', color: '#4A6CF7', whiteSpace: 'nowrap' },
  actionBtns: { display: 'flex', gap: 6 },
  iconBtnBlue: { width: 32, height: 32, borderRadius: 8, border: '1.5px solid rgba(74,108,247,0.2)', background: 'rgba(74,108,247,0.05)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A6CF7', transition: '0.2s' },
  filterBtn: { padding: '8px 16px', borderRadius: 30, border: '1.5px solid #DDE4F3', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#7A8BAD', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },
  filterBtnActive: { background: '#4A6CF7', border: '1.5px solid #4A6CF7', color: '#fff' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(10,20,50,0.55)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 28px 70px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1.5px solid #EEF2FF' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#1A2B4A' },
  modalIcon: { width: 38, height: 38, background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' },
  modalClose: { width: 34, height: 34, borderRadius: 8, border: '1.5px solid #DDE4F3', background: '#F5F8FF', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A8BAD' },
  modalBody: { padding: '24px 28px', overflowY: 'auto', flex: 1 },
  modalSection: { marginBottom: 24 },
  modalSectionLabel: { fontSize: 10.5, fontWeight: 900, color: '#7A8BAD', textTransform: 'uppercase', letterSpacing: '1.3px', marginBottom: 14 },
  modalGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  mfg: { display: 'flex', flexDirection: 'column', gap: 5 },
  ml: { fontSize: 11.5, fontWeight: 700, color: '#7A8BAD' },
  mi: { background: '#F5F8FF', border: '1.5px solid #DDE4F3', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: "'Nunito', sans-serif", color: '#1A2B4A', outline: 'none', width: '100%', boxSizing: 'border-box' },
  miErr: { borderColor: '#FF6B6B', background: 'rgba(255,107,107,0.04)' },
  errTxt: { fontSize: 11, color: '#FF6B6B', fontWeight: 700 },
  errBanner: { background: 'rgba(255,107,107,0.08)', border: '1.5px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#FF6B6B', fontWeight: 700, marginBottom: 16 },
  statusToggle: { padding: '8px 16px', borderRadius: 30, border: '1.5px solid #DDE4F3', background: '#F5F8FF', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#7A8BAD', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },
  statusToggleActive: { background: '#4A6CF7', border: '1.5px solid #4A6CF7', color: '#fff' },
  permGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
  permCard: { padding: '14px 12px', border: '2px solid #DDE4F3', borderRadius: 12, cursor: 'pointer', transition: '0.2s', position: 'relative', background: '#F5F8FF' },
  permCardActive: { border: '2px solid #4A6CF7', background: 'rgba(74,108,247,0.05)' },
  permIcon: { fontSize: 20, marginBottom: 6 },
  permLabel: { fontSize: 13, fontWeight: 800, color: '#1A2B4A', marginBottom: 3 },
  permDesc: { fontSize: 11, color: '#7A8BAD', lineHeight: 1.4 },
  permCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', border: '2px solid #DDE4F3', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 },
  permCheckActive: { background: '#4A6CF7', borderColor: '#4A6CF7', color: '#fff' },
  modalFooter: { display: 'flex', gap: 12, padding: '18px 28px', borderTop: '1.5px solid #EEF2FF', justifyContent: 'flex-end' },
  btnPrimary: { padding: '11px 24px', borderRadius: 30, border: 'none', background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: '0 6px 20px rgba(74,108,247,0.35)', transition: '0.2s' },
  btnGhost: { padding: '11px 24px', borderRadius: 30, border: '1.5px solid #DDE4F3', background: '#F5F8FF', color: '#7A8BAD', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },
  toast: { position: 'fixed', bottom: 24, right: 24, color: '#fff', padding: '14px 24px', borderRadius: 14, fontSize: 14, fontWeight: 800, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 2000, fontFamily: "'Nunito', sans-serif", maxWidth: 400 },
};