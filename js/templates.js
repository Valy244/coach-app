// Modèles de programmes proposés à la création d'un client.
// Les illustrations sont dans le dossier ill/.
export const TEMPLATES = [
  {
    id: "hyper5",
    name: "Hypertrophie 5 séances (dos-épaules, pecs, jambes, bras, pecs-triceps)",
    seances: [
      {
        "id": "se-g1",
        "title": "DOS + ÉPAULES",
        "warmup": "5 min de rameur (ne te crame pas)",
        "exercises": [
          {
            "id": "ex-g11",
            "name": "TIRAGE VERTICAL UNILATÉRAL",
            "rest": "2 min 30",
            "img": "ill/s1e1.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": 42.5,
                "unit": "kg",
                "note": "",
                "drop": {
                  "reps": 12,
                  "load": 35,
                  "unit": "kg",
                  "note": "en moins lourd"
                }
              },
              {
                "count": 1,
                "reps": 15,
                "load": 37.5,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g12",
            "name": "TIRAGE HORIZONTAL PRISE SERRÉE",
            "rest": "2 min 30",
            "img": "ill/s1e2.jpg",
            "sets": [
              {
                "count": 1,
                "reps": 17,
                "load": 65,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 1,
                "reps": 15,
                "load": 62.5,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 2,
                "reps": 12,
                "load": 70,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 1,
                "reps": 10,
                "load": 75,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g13",
            "name": "ROWING BUSTE PENCHÉ À LA SMITH",
            "rest": "3 min",
            "img": "ill/s1e3.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": 70,
                "unit": "+kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 1,
                "reps": 15,
                "load": 55,
                "unit": "+kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g14",
            "name": "PULL OVER À LA POULIE",
            "rest": "2 min 30",
            "img": "ill/s1e4.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": 95,
                "unit": "kg",
                "note": "avec pic de contraction"
              },
              {
                "count": 2,
                "reps": 12,
                "load": 90,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g15",
            "name": "OISEAU À LA POULIE HAUTEUR D'ÉPAULE",
            "rest": "2 min",
            "img": "ill/s1e5.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": 12.5,
                "unit": "kg/côté",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 2,
                "reps": 15,
                "load": 10,
                "unit": "kg/côté",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g16",
            "name": "ÉLÉVATIONS FRONTALES ALTERNÉES",
            "rest": "2 min",
            "img": "ill/s1e6.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 13,
                "load": 18,
                "unit": "kg",
                "note": "par bras"
              }
            ]
          },
          {
            "id": "ex-g17",
            "name": "RELEVÉ DE BUSTE",
            "rest": "2 min",
            "img": "ill/s1e7.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 13,
                "load": 38,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              }
            ]
          }
        ]
      },
      {
        "id": "se-g2",
        "title": "PECTORAUX",
        "warmup": "5 min de rameur (ne te crame pas)",
        "exercises": [
          {
            "id": "ex-g21",
            "name": "ÉCARTÉ À LA POULIE VIS-À-VIS POSITION BASSE",
            "rest": "2 min 30",
            "img": "ill/s2e1.jpg",
            "sets": [
              {
                "count": 1,
                "reps": 15,
                "load": 25,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 1,
                "reps": 14,
                "load": 25,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 2,
                "reps": 10,
                "load": 27.5,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 1,
                "reps": 9,
                "load": 30,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g22",
            "name": "DIPS LESTÉS FOCUS PEC",
            "rest": "3 min",
            "img": "ill/s2e2.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 10,
                "load": 45,
                "unit": "+kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g23",
            "name": "DÉVELOPPÉ COUCHÉ CONVERGENT PRISE LARGE",
            "rest": "2 min 30",
            "img": "ill/s2e3.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": 65,
                "unit": "kg/côté",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 2,
                "reps": 12,
                "load": 55,
                "unit": "kg/côté",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g24",
            "name": "PEC FLY",
            "rest": "2 min 30",
            "img": "ill/s2e4.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": 40,
                "unit": "kg",
                "note": "avec pic de contraction"
              },
              {
                "count": 1,
                "reps": 12,
                "load": 32.5,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g25",
            "name": "ABDOS AU ROULEAU (BARRE + DISQUE)",
            "rest": "2 min",
            "img": "ill/s2e5.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 12,
                "load": null,
                "unit": "",
                "note": "avec 3 secondes de descente"
              }
            ]
          },
          {
            "id": "ex-g26",
            "name": "OBLIQUES AVEC HALTÈRE",
            "rest": "2 min",
            "img": "ill/s2e6.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 12,
                "load": 32,
                "unit": "kg",
                "note": "par côté avec 2 secondes de descente"
              }
            ]
          }
        ]
      },
      {
        "id": "se-g3",
        "title": "JAMBES",
        "warmup": "7 min de vélo ou course (ne te crame pas)",
        "exercises": [
          {
            "id": "ex-g31",
            "name": "LEG PRESS UNILATÉRALE",
            "rest": "3 min",
            "img": "ill/s3e1.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": 87,
                "unit": "kg",
                "note": "avec 1 seconde en bas"
              },
              {
                "count": 2,
                "reps": 12,
                "load": 72.5,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g32",
            "name": "GOOD MORNING À LA BARRE",
            "rest": "2 min 30",
            "img": "ill/s3e2.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": 50,
                "unit": "kg",
                "note": "avec 3 secondes de descente"
              },
              {
                "count": 1,
                "reps": 15,
                "load": 42.5,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g33",
            "name": "STEP-UP HALTÈRES SUR BANC",
            "rest": "2 min 30",
            "img": "ill/s3e3.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": 24,
                "unit": "kg/main",
                "note": ""
              },
              {
                "count": 1,
                "reps": 12,
                "load": 20,
                "unit": "kg/main",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g34",
            "name": "LEG CURL DEBOUT UNILATÉRAL",
            "rest": "2 min 30",
            "img": "ill/s3e4.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": 30,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 2,
                "reps": 12,
                "load": 22.5,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g35",
            "name": "LEG EXTENSION",
            "rest": "2 min",
            "img": "ill/s3e5.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": 72.5,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 2,
                "reps": 12,
                "load": 65,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g36",
            "name": "EXTENSION MOLLETS À LA SMITH",
            "rest": "2 min",
            "img": "ill/s3e6.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 12,
                "load": 70,
                "unit": "kg",
                "note": "avec 1 seconde en haut et en bas"
              }
            ]
          }
        ]
      },
      {
        "id": "se-g4",
        "title": "BRAS + ÉPAULES",
        "warmup": "5 min de rameur (ne te crame pas)",
        "exercises": [
          {
            "id": "ex-g41",
            "name": "CURL UNILATÉRAL POULIE BASSE À LA POIGNÉE",
            "rest": "2 min",
            "img": "ill/s4e1.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": 22.5,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 2,
                "reps": 15,
                "load": 17.5,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g42",
            "name": "CURL BARRE EZ PRISE SERRÉE + CURL LARRY SCOTT GUIDÉ",
            "rest": "2 min 30",
            "img": "ill/s4e2.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": 40,
                "unit": "+kg",
                "note": "avec pic de contraction",
                "drop": {
                  "reps": 12,
                  "load": 27.5,
                  "unit": "kg",
                  "note": ""
                }
              },
              {
                "count": 1,
                "reps": 11,
                "load": 37.5,
                "unit": "+kg",
                "note": "",
                "drop": {
                  "reps": 10,
                  "load": 27.5,
                  "unit": "kg",
                  "note": ""
                }
              }
            ]
          },
          {
            "id": "ex-g43",
            "name": "JM PRESS SMITH + EXTENSION TRICEPS À LA CORDE",
            "rest": "3 min",
            "img": "ill/s4e3.jpg",
            "sets": [
              {
                "count": 4,
                "reps": 11,
                "load": 90,
                "unit": "kg",
                "note": "",
                "drop": {
                  "reps": 12,
                  "load": 40,
                  "unit": "kg",
                  "note": ""
                }
              }
            ]
          },
          {
            "id": "ex-g44",
            "name": "CURL MARTEAU HALTÈRES EN SIMULTANÉ",
            "rest": "2 min 30",
            "img": null,
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": 22,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 1,
                "reps": 13,
                "load": 18,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g45",
            "name": "EXTENSION TRICEPS OVERHEAD HALTÈRE",
            "rest": "2 min",
            "img": "ill/s4e5.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": 38,
                "unit": "kg",
                "note": "en tension continue, ne cambre pas"
              },
              {
                "count": 1,
                "reps": 13,
                "load": 34,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g46",
            "name": "ÉLÉVATIONS LATÉRALES MACHINE GUIDÉE",
            "rest": "2 min",
            "img": "ill/s4e6.jpg",
            "sets": [
              {
                "count": 1,
                "reps": 10,
                "load": 50,
                "unit": "kg/côté",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 2,
                "reps": 14,
                "load": 42.5,
                "unit": "kg/côté",
                "note": ""
              }
            ]
          }
        ]
      },
      {
        "id": "se-g5",
        "title": "PECS + RAPPEL TRICEPS",
        "warmup": "5 min de rameur (ne te crame pas)",
        "exercises": [
          {
            "id": "ex-g51",
            "name": "PEC FLY",
            "rest": "2 min 30",
            "img": "ill/s5e1.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 15,
                "load": 35,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 2,
                "reps": 11,
                "load": 40,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g52",
            "name": "DÉVELOPPÉ COUCHÉ INCLINÉ AUX HALTÈRES",
            "rest": "2 min 30",
            "img": "ill/s5e2.jpg",
            "sets": [
              {
                "count": 1,
                "reps": 10,
                "load": 42,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 2,
                "reps": 13,
                "load": 37,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g53",
            "name": "DÉVELOPPÉ COUCHÉ À LA SMITH",
            "rest": "3 min",
            "img": "ill/s5e3.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": 110,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 1,
                "reps": 13,
                "load": 90,
                "unit": "kg",
                "note": "en double contraction en bas"
              }
            ]
          },
          {
            "id": "ex-g54",
            "name": "EXTENSION TRICEPS UNILATÉRALE POULIE SUPINATION",
            "rest": "2 min",
            "img": "ill/s5e4.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": 15,
                "unit": "kg",
                "note": "avec 1 seconde en bas"
              },
              {
                "count": 2,
                "reps": 13,
                "load": 12.5,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g55",
            "name": "EXTENSION TRICEPS OVERHEAD HALTÈRE",
            "rest": "2 min 30",
            "img": "ill/s5e5.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": 36,
                "unit": "kg",
                "note": "en tension continue"
              },
              {
                "count": 1,
                "reps": 15,
                "load": 32,
                "unit": "kg",
                "note": ""
              }
            ]
          },
          {
            "id": "ex-g56",
            "name": "POMPES SURÉLEVÉES",
            "rest": "2 min 30",
            "img": "ill/s5e6.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 15,
                "load": null,
                "unit": "",
                "note": "avec 3 secondes de descente et 1 seconde en bas"
              }
            ]
          }
        ]
      }
    ],
  },
  {
    id: "fullbody3",
    name: "Full body 3 séances (hypertrophie)",
    seances: [
      {
        "id": "se-fb1",
        "title": "FULL BODY A",
        "warmup": "5 min de rameur (ne te crame pas)",
        "exercises": [
          {
            "name": "SQUAT LIBRE FULL AMPLITUDE",
            "rest": "3 min",
            "img": "ill/lib/086.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 8,
                "load": null,
                "unit": "kg",
                "note": "avec 2 secondes de descente"
              },
              {
                "count": 2,
                "reps": 11,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb11"
          },
          {
            "name": "DÉVELOPPÉ COUCHÉ BARRE LIBRE",
            "rest": "2 min 30",
            "img": "ill/lib/091.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 8,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde en bas"
              },
              {
                "count": 2,
                "reps": 11,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb12"
          },
          {
            "name": "TRACTIONS PRONATION LESTÉES",
            "rest": "2 min 30",
            "img": "ill/lib/040.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 8,
                "load": null,
                "unit": "+kg",
                "note": "(ajoute du lest si tu dépasses 10 répétitions au poids du corps)"
              },
              {
                "count": 1,
                "reps": "max",
                "load": null,
                "unit": "",
                "note": "au poids du corps"
              }
            ],
            "id": "ex-fb13"
          },
          {
            "name": "SOULEVÉ DE TERRE ROUMAIN À LA BARRE",
            "rest": "2 min 30",
            "img": null,
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg",
                "note": "avec 3 secondes de descente, dos neutre"
              },
              {
                "count": 1,
                "reps": 12,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb14"
          },
          {
            "name": "ROWING GUIDÉ POITRINE APPUYÉE",
            "rest": "2 min",
            "img": "ill/lib/188.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 1,
                "reps": 13,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb15"
          },
          {
            "name": "DÉVELOPPÉ MILITAIRE DEBOUT BARRE LIBRE",
            "rest": "2 min 30",
            "img": "ill/lib/050.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 8,
                "load": null,
                "unit": "kg",
                "note": ""
              },
              {
                "count": 1,
                "reps": 11,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb16"
          },
          {
            "name": "CURL BARRE EZ PRISE SUPINATION",
            "rest": "2 min",
            "img": "ill/lib/108.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": null,
                "unit": "kg",
                "note": "avec descente contrôlée"
              },
              {
                "count": 1,
                "reps": 12,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb17"
          },
          {
            "name": "ROUE ABDOMINALE",
            "rest": "2 min",
            "img": "ill/lib/059.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 12,
                "load": null,
                "unit": "",
                "note": "en amplitude maximale contrôlée"
              }
            ],
            "id": "ex-fb18"
          }
        ]
      },
      {
        "id": "se-fb2",
        "title": "FULL BODY B",
        "warmup": "5 min de rameur (ne te crame pas)",
        "exercises": [
          {
            "name": "DÉVELOPPÉ INCLINÉ HALTÈRES",
            "rest": "2 min 30",
            "img": "ill/lib/030.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 9,
                "load": null,
                "unit": "kg/main",
                "note": "avec 2 secondes de descente"
              },
              {
                "count": 2,
                "reps": 12,
                "load": null,
                "unit": "kg/main",
                "note": ""
              }
            ],
            "id": "ex-fb21"
          },
          {
            "name": "FENTES MARCHÉES AUX HALTÈRES",
            "rest": "2 min 30",
            "img": "ill/lib/173.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg/main",
                "note": "par jambe"
              },
              {
                "count": 1,
                "reps": 12,
                "load": null,
                "unit": "kg/main",
                "note": "par jambe"
              }
            ],
            "id": "ex-fb22"
          },
          {
            "name": "TIRAGE VERTICAL PRISE SERRÉE NEUTRE",
            "rest": "2 min 30",
            "img": "ill/lib/187.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde en bas"
              },
              {
                "count": 1,
                "reps": 13,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb23"
          },
          {
            "name": "LEG CURL DEBOUT UNILATÉRAL",
            "rest": "2 min",
            "img": "ill/s3e4.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 1,
                "reps": 13,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb24"
          },
          {
            "name": "SEAL ROW HALTÈRES COUDES OUVERTS",
            "rest": "2 min",
            "img": "ill/lib/120.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg/main",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 1,
                "reps": 12,
                "load": null,
                "unit": "kg/main",
                "note": ""
              }
            ],
            "id": "ex-fb25"
          },
          {
            "name": "ÉLÉVATIONS LATÉRALES HALTÈRES",
            "rest": "2 min",
            "img": "ill/lib/044.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": null,
                "unit": "kg/main",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 2,
                "reps": 15,
                "load": null,
                "unit": "kg/main",
                "note": ""
              }
            ],
            "id": "ex-fb26"
          },
          {
            "name": "DIPS AUX BARRES PARALLÈLES",
            "rest": "2 min",
            "img": "ill/lib/058.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "+kg",
                "note": "(ajoute du lest si tu dépasses 12 répétitions au poids du corps)"
              },
              {
                "count": 1,
                "reps": "max",
                "load": null,
                "unit": "",
                "note": "au poids du corps"
              }
            ],
            "id": "ex-fb27"
          },
          {
            "name": "EXTENSION LOMBAIRE AU PUPITRE",
            "rest": "2 min",
            "img": "ill/lib/164.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 12,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              }
            ],
            "id": "ex-fb28"
          }
        ]
      },
      {
        "id": "se-fb3",
        "title": "FULL BODY C",
        "warmup": "5 min de vélo (ne te crame pas)",
        "exercises": [
          {
            "name": "GOBLET SQUAT TALONS SURÉLEVÉS",
            "rest": "2 min 30",
            "img": null,
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg",
                "note": "avec 3 secondes de descente"
              },
              {
                "count": 1,
                "reps": 13,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb31"
          },
          {
            "name": "HIP THRUST À LA BARRE",
            "rest": "2 min 30",
            "img": "ill/lib/021.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 1,
                "reps": 12,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb32"
          },
          {
            "name": "ÉCARTÉ COUCHÉ ENTRE LES POULIES",
            "rest": "2 min",
            "img": "ill/lib/057.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg/côté",
                "note": "avec 1 seconde en position étirée"
              },
              {
                "count": 1,
                "reps": 12,
                "load": null,
                "unit": "kg/côté",
                "note": "+ 6 répétitions partielles en position étirée"
              }
            ],
            "id": "ex-fb33"
          },
          {
            "name": "TIRAGE HORIZONTAL PRISE LARGE PRONATION",
            "rest": "2 min",
            "img": "ill/lib/061.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde de contraction"
              },
              {
                "count": 1,
                "reps": 13,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb34"
          },
          {
            "name": "OISEAU AUX HALTÈRES",
            "rest": "2 min",
            "img": "ill/lib/084.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": null,
                "unit": "kg/main",
                "note": "avec 1 seconde en haut"
              },
              {
                "count": 1,
                "reps": 15,
                "load": null,
                "unit": "kg/main",
                "note": "en tension continue"
              }
            ],
            "id": "ex-fb35"
          },
          {
            "name": "CURL INCLINÉ HALTÈRES SUPINATION",
            "rest": "",
            "img": "ill/lib/018.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 10,
                "load": null,
                "unit": "kg/main",
                "note": "enchaîné sans repos avec l'exercice suivant (superset)"
              },
              {
                "count": 1,
                "reps": 12,
                "load": null,
                "unit": "kg/main",
                "note": "en superset"
              }
            ],
            "id": "ex-fb36"
          },
          {
            "name": "KICK-BACK À LA POULIE",
            "rest": "2 min",
            "img": "ill/lib/006.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": null,
                "unit": "kg",
                "note": "enchaîné directement après le curl"
              },
              {
                "count": 1,
                "reps": 14,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb37"
          },
          {
            "name": "MOLLETS ASSIS",
            "rest": "2 min",
            "img": "ill/lib/048.jpg",
            "sets": [
              {
                "count": 2,
                "reps": 12,
                "load": null,
                "unit": "kg",
                "note": "avec 1 seconde en bas"
              },
              {
                "count": 2,
                "reps": 15,
                "load": null,
                "unit": "kg",
                "note": ""
              }
            ],
            "id": "ex-fb38"
          },
          {
            "name": "PALLOF PRESS À LA POULIE",
            "rest": "1 min 30",
            "img": "ill/lib/116.jpg",
            "sets": [
              {
                "count": 3,
                "reps": 12,
                "load": null,
                "unit": "kg",
                "note": "par côté"
              }
            ],
            "id": "ex-fb39"
          }
        ]
      }
    ],
  },
];
