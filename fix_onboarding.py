f = open('src/screens/OnboardingScreen.tsx', 'w')
f.write(open('src/screens/OnboardingScreen.tsx').read().replace("n'importe", "nimporte").replace("L'IA", "L IA"))
f.close()
print('OK')
