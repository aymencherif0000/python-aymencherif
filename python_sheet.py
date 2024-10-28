#1 .imprimer du texte :

print("bonjour, monde !")

#2. variables :

# variables de type entier , flottant et chaine de caracteres
x = 10 
y = 3,14
nom = "alice"
print(x,y, nom)

#3. operations mathematiques :

a = 5
b = 2
somme = a+b
produit = a*b
quotient = a/b
reste =a % b
puissance = a ** b
print(somme,produit,quotient,reste,puissance)

#4. condition (if/else) : 


age =18
if age >= 18:
    print("tu es majeur .")
else:
    print("tu es mineur .:")


#5. boucles (for et while) : 
# boucle for

for i in range (5):
    print("i vaut :", i)

#bocle while :


compteur = 0
while compteur < 5:
    print("compteur :" , compteur)
    compteur += 1

    #6. fonctions :

    def salut(nom):
        return f"salut, {nom}!"
    message = salut("alice")
    print(message)


#7. listes :

