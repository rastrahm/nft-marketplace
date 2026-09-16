const I18N = {
  es: {
    'html.lang': 'es',
    'meta.title': 'NFT Marketplace Escrow — Rolando Strahm',
    'meta.description':
      'Marketplace NFT con escrow, ERC-2981, fee de protocolo, optimización de gas y verificación SWC. Foundry · Solidity 0.8.24.',

    'nav.overview': 'Proyecto',
    'nav.pillars': 'Pilares',
    'nav.gas': 'Gas',
    'nav.swc': 'SWC',
    'nav.process': 'Proceso',
    'nav.attacks': 'Ataques',
    'nav.repos': 'Repos',
    'nav.close': '← Cerrar',

    'hero.tag': '// MÓDULO 05 · PORTFOLIO WEB3',
    'hero.title': 'NFT MARKETPLACE<br>ESCROW + ROYALTIES',
    'hero.role': 'Solidity 0.8.24 · Foundry · Gas · SWC',
    'hero.sub':
      'Marketplace NFT con escrow seguro, royalties ERC-2981, fee de protocolo, optimización de gas documentada y verificación defensiva contra el SWC Registry.',
    'hero.cta1': 'Ver en GitHub',
    'hero.cta2': 'Ver en GitLab',

    'ov.eyebrow': '// 01 — CONTEXTO',
    'ov.title': 'Por qué este proyecto',
    'ov.lead':
      'Para no oxidar mis conocimientos en <strong>Solidity</strong>, construí un marketplace NFT de escrow desde cero con Foundry. El módulo cierra el ciclo con <strong>optimización de gas</strong> (Listing 2 slots, guard transient EIP-1153) y <strong>verificación de ataques</strong> — reentrancy, royalties y fuzz de precios/fees.',

    'pi.eyebrow': '// 02 — TRES PILARES',
    'pi.title': 'Qué entrega el módulo',
    'p1.num': '// PILAR_01',
    'p1.title': 'Escrow + ERC-2981',
    'p1.desc':
      'List / cancel / buy con NFT en custodia vía safeTransferFrom; fee de protocolo e royalties dinámicas si el token soporta IERC2981.',
    'p1.l1': 'CEI antes de transfers y ETH',
    'p1.l2': 'Custom errors (sin require strings)',
    'p1.l3': 'Payouts con .call{value}',
    'p2.num': '// PILAR_02',
    'p2.title': 'Optimización de gas',
    'p2.desc':
      'Struct Listing en 2 slots, ReentrancyGuard transient (EIP-1153), unchecked tras invariantes y reportes Foundry documentados.',
    'p2.l1': 'listItem avg ≈ −28%',
    'p2.l2': 'getListing ≈ −47%',
    'p2.l3': 'Deploy −6.8% gas',
    'p3.num': '// PILAR_03',
    'p3.title': 'Verificación de ataques',
    'p3.desc':
      'Matriz SWC-100–136, suite de reentrancy con MaliciousActor, fuzz 1000 runs y 0 vulnerabilidades explotables.',
    'p3.l1': 'SWC-107: CEI + nonReentrant',
    'p3.l2': '25 tests Foundry verdes',
    'p3.l3': '0 vulnerabilidades SWC',

    'gas.eyebrow': '// 03 — OPTIMIZACIÓN DE GAS',
    'gas.title': 'Menos SSTORE, mismo escrow',
    'gas.lead':
      'Fase 8: cada optimización está documentada con su <strong>tradeoff</strong> en <code>doc/GAS.md</code>. El hot path baja lecturas/escrituras de storage sin sacrificar CEI ni el guard de reentrancy.',
    'gas.th1': 'Optimización',
    'gas.th2': 'Tradeoff / efecto',
    'gas.r1a': 'Listing { seller, price } — 2 slots (nft/tokenId en keys)',
    'gas.r1b': '~2× menos SSTORE/SLOAD/delete; listItem avg −28%',
    'gas.r2a': 'ReentrancyGuard transient (EIP-1153 / Cancun)',
    'gas.r2b': 'Sin SSTORE permanente del lock en buy/cancel',
    'gas.r3a': 'unchecked en msg.value − price y remaining − royalty',
    'gas.r3b': 'Solo tras msg.value ≥ price y cap de royalty',
    'gas.r4a': 'feeBps / feeRecipient / _BPS_DENOMINATOR immutables',
    'gas.r4b': 'Lecturas baratas en el split de compra',
    'gas.r5a': '!= 0 vs > 0 en montos de pago',
    'gas.r5b': 'Micro-ahorro; equivalente para uint256',
    'gas.r6a': 'Funciones external + custom errors',
    'gas.r6b': 'ABI más barato y reverts compactos',
    'gas.r7a': 'getListing post-opt',
    'gas.r7b': 'Avg 4 924 (−47%): 2 cold SLOADs',

    'swc.eyebrow': '// 04 — VERIFICACIÓN SWC',
    'swc.title': 'SWC Registry · EIP-1470',
    'swc.lead':
      'Fase 8: matriz completa <strong>SWC-100 → SWC-136</strong> contra <code>NFTMarketplace</code>. Informe en <code>doc/SWC-AUDIT.md</code>. Conclusión: <strong>0 vulnerabilidades explotables</strong> en el alcance del marketplace.',
    'swc.s1': 'Mitigados / N/A',
    'swc.s2': 'Informativos (diseño)',
    'swc.s3': 'Vulnerables',
    'swc.th1': 'SWC clave',
    'swc.th2': 'Mitigación en el contrato',
    'swc.r101': 'Integer overflow: Solidity 0.8.24 + royalty capeada a remaining',
    'swc.r103': 'Floating pragma: pragma solidity 0.8.24 fijo',
    'swc.r104': 'Unchecked call: _pay chequea success; safeTransferFrom OZ',
    'swc.r107': 'Reentrancy: CEI + nonReentrant transient; attack suite',
    'swc.r128': 'DoS gas limit: paths O(1); sin loops sobre listings',
    'swc.r132': 'ETH inesperado: sin acumular ventas; refund de exceso',
    'swc.info': 'INFORMATIVO',
    'swc.i1t': 'DoS receptor ETH',
    'swc.i1d':
      'Si seller/fee/royalty rechazan ETH, buyItem revierte con TransferFailed y el listing permanece consistente. Pull-payments fuera de alcance v1.',
    'swc.i2t': 'Approve race ERC-721',
    'swc.i2d':
      'Entre approve(marketplace) y listItem, un spender previo podría mover el token. Mitigación de producto: setApprovalForAll acotado + list atómico.',

    'pr.eyebrow': '// 05 — PROCESO',
    'pr.title': 'Fases 0–8 cerradas',
    'pr.lead':
      'Desarrollo por gates: bootstrap Foundry, interfaz, core escrow, royalties/fee, gas, unit/attack/fuzz, review SWC y demo UI.',
    'ph.0': 'Bootstrap Foundry',
    'ph.13': 'Interface + escrow + royalties',
    'ph.46': 'Gas + unit/attack/fuzz',
    'ph.78': 'Review + SWC + transient',
    'ph.ui': 'Demo Next.js + deploy',
    'st.1': 'Fases',
    'st.2': 'Tests Foundry',
    'st.3': 'SWC críticos',
    'st.4': 'listItem gas',
    'term.label': 'rolando@strahm:~/05-nft-marketplace',
    'term.1': 'forge test --match-path test/attack',
    'term.2': '[PASS] ReentrancyAttack · suite',
    'term.3': 'cat doc/SWC-AUDIT.md | head',
    'term.4': 'Vulnerable: 0 · Informativos: 4 · Mitigados/N/A: 32',
    'term.5': 'echo status',
    'term.6': 'MODULE_05_CLOSED · GAS_OPT_CLOSED · SWC_CLOSED',

    'at.eyebrow': '// 06 — CAMPAÑAS DE ATAQUE',
    'at.title': 'Defensivo, no ofensivo',
    'at.lead':
      'Cada campaña es un test Foundry donde el “ataque” debe fallar. Sin PoCs de exploit: reentrancy vía seller/buyer maliciosos, integridad de listing, split royalty/fee y fuzz de precios.',
    'cA.t': 'Reentrancy',
    'cA.d': 'Seller/buyer MaliciousActor en buy/cancel.',
    'cB.t': 'Escrow',
    'cB.d': 'List → cancel → re-list → buy e2e.',
    'cC.t': 'Royalties',
    'cC.d': 'Split fee + ERC-2981 con cap on-chain.',
    'cD.t': 'Fuzz',
    'cD.d': 'price / feeBps / royalty con bound().',
    'cE.t': 'Diseño',
    'cE.d': 'DoS ETH, approve race, trust deploy fee.',

    're.eyebrow': '// 07 — CÓDIGO ABIERTO',
    're.title': 'Repositorios',
    're.lead':
      'El mismo código está publicado en GitHub y GitLab: contrato, tests, gas report, auditoría SWC y demo UI.',
    're.cta': 'Contactar',
    're.linkedin': 'LinkedIn',

    'ft.left': 'ROLANDO STRAHM — NFT Marketplace Escrow · Portfolio',
    'ft.right': 'FOUNDRY · SOLC 0.8.24 · ALL_SYSTEMS_OPERATIONAL',
  },

  en: {
    'html.lang': 'en',
    'meta.title': 'NFT Marketplace Escrow — Rolando Strahm',
    'meta.description':
      'NFT marketplace with escrow, ERC-2981, protocol fee, gas optimization, and SWC verification. Foundry · Solidity 0.8.24.',

    'nav.overview': 'Project',
    'nav.pillars': 'Pillars',
    'nav.gas': 'Gas',
    'nav.swc': 'SWC',
    'nav.process': 'Process',
    'nav.attacks': 'Attacks',
    'nav.repos': 'Repos',
    'nav.close': '← Close',

    'hero.tag': '// MODULE 05 · WEB3 PORTFOLIO',
    'hero.title': 'NFT MARKETPLACE<br>ESCROW + ROYALTIES',
    'hero.role': 'Solidity 0.8.24 · Foundry · Gas · SWC',
    'hero.sub':
      'NFT marketplace with secure escrow, ERC-2981 royalties, protocol fee, documented gas optimizations, and defensive verification against the SWC Registry.',
    'hero.cta1': 'View on GitHub',
    'hero.cta2': 'View on GitLab',

    'ov.eyebrow': '// 01 — CONTEXT',
    'ov.title': 'Why this project',
    'ov.lead':
      'To keep my <strong>Solidity</strong> skills sharp, I built an escrow NFT marketplace from scratch with Foundry. The module closes the loop with <strong>gas optimization</strong> (2-slot Listing, EIP-1153 transient guard) and <strong>attack verification</strong> — reentrancy, royalties, and price/fee fuzzing.',

    'pi.eyebrow': '// 02 — THREE PILLARS',
    'pi.title': 'What the module ships',
    'p1.num': '// PILLAR_01',
    'p1.title': 'Escrow + ERC-2981',
    'p1.desc':
      'List / cancel / buy with NFT custody via safeTransferFrom; protocol fee and dynamic royalties when the token supports IERC2981.',
    'p1.l1': 'CEI before transfers and ETH',
    'p1.l2': 'Custom errors (no require strings)',
    'p1.l3': 'Payouts via .call{value}',
    'p2.num': '// PILLAR_02',
    'p2.title': 'Gas optimization',
    'p2.desc':
      '2-slot Listing struct, transient ReentrancyGuard (EIP-1153), unchecked after invariants, and documented Foundry reports.',
    'p2.l1': 'listItem avg ≈ −28%',
    'p2.l2': 'getListing ≈ −47%',
    'p2.l3': 'Deploy −6.8% gas',
    'p3.num': '// PILLAR_03',
    'p3.title': 'Attack verification',
    'p3.desc':
      'SWC-100–136 matrix, reentrancy suite with MaliciousActor, 1000-run fuzz, and 0 exploitable vulnerabilities.',
    'p3.l1': 'SWC-107: CEI + nonReentrant',
    'p3.l2': '25 green Foundry tests',
    'p3.l3': '0 exploitable SWC findings',

    'gas.eyebrow': '// 03 — GAS OPTIMIZATION',
    'gas.title': 'Fewer SSTOREs, same escrow',
    'gas.lead':
      'Phase 8: every optimization is documented with its <strong>tradeoff</strong> in <code>doc/GAS.md</code>. The hot path cuts storage reads/writes without sacrificing CEI or the reentrancy guard.',
    'gas.th1': 'Optimization',
    'gas.th2': 'Tradeoff / effect',
    'gas.r1a': 'Listing { seller, price } — 2 slots (nft/tokenId in keys)',
    'gas.r1b': '~2× fewer SSTORE/SLOAD/delete; listItem avg −28%',
    'gas.r2a': 'Transient ReentrancyGuard (EIP-1153 / Cancun)',
    'gas.r2b': 'No permanent SSTORE for the lock on buy/cancel',
    'gas.r3a': 'unchecked for msg.value − price and remaining − royalty',
    'gas.r3b': 'Only after msg.value ≥ price and royalty cap',
    'gas.r4a': 'feeBps / feeRecipient / _BPS_DENOMINATOR immutables',
    'gas.r4b': 'Cheap reads on the purchase split',
    'gas.r5a': '!= 0 vs > 0 for payment amounts',
    'gas.r5b': 'Micro-saving; equivalent for uint256',
    'gas.r6a': 'external functions + custom errors',
    'gas.r6b': 'Cheaper ABI and compact reverts',
    'gas.r7a': 'getListing post-opt',
    'gas.r7b': 'Avg 4 924 (−47%): 2 cold SLOADs',

    'swc.eyebrow': '// 04 — SWC VERIFICATION',
    'swc.title': 'SWC Registry · EIP-1470',
    'swc.lead':
      'Phase 8: full matrix <strong>SWC-100 → SWC-136</strong> against <code>NFTMarketplace</code>. Report in <code>doc/SWC-AUDIT.md</code>. Conclusion: <strong>0 exploitable vulnerabilities</strong> in marketplace scope.',
    'swc.s1': 'Mitigated / N/A',
    'swc.s2': 'Informational (design)',
    'swc.s3': 'Vulnerable',
    'swc.th1': 'Key SWC',
    'swc.th2': 'Mitigation in the contract',
    'swc.r101': 'Integer overflow: Solidity 0.8.24 + royalty capped to remaining',
    'swc.r103': 'Floating pragma: fixed pragma solidity 0.8.24',
    'swc.r104': 'Unchecked call: _pay checks success; OZ safeTransferFrom',
    'swc.r107': 'Reentrancy: CEI + transient nonReentrant; attack suite',
    'swc.r128': 'DoS gas limit: O(1) paths; no loops over listings',
    'swc.r132': 'Unexpected ETH: no sale accrual; excess refund',
    'swc.info': 'INFORMATIONAL',
    'swc.i1t': 'ETH recipient DoS',
    'swc.i1d':
      'If seller/fee/royalty reject ETH, buyItem reverts with TransferFailed and the listing stays consistent. Pull-payments out of v1 scope.',
    'swc.i2t': 'ERC-721 approve race',
    'swc.i2d':
      'Between approve(marketplace) and listItem, a prior spender could move the token. Product mitigation: scoped setApprovalForAll + atomic list.',

    'pr.eyebrow': '// 05 — PROCESS',
    'pr.title': 'Phases 0–8 closed',
    'pr.lead':
      'Gated delivery: Foundry bootstrap, interface, escrow core, royalties/fee, gas, unit/attack/fuzz, SWC review, and demo UI.',
    'ph.0': 'Foundry bootstrap',
    'ph.13': 'Interface + escrow + royalties',
    'ph.46': 'Gas + unit/attack/fuzz',
    'ph.78': 'Review + SWC + transient',
    'ph.ui': 'Next.js demo + deploy',
    'st.1': 'Phases',
    'st.2': 'Foundry tests',
    'st.3': 'Critical SWC',
    'st.4': 'listItem gas',
    'term.label': 'rolando@strahm:~/05-nft-marketplace',
    'term.1': 'forge test --match-path test/attack',
    'term.2': '[PASS] ReentrancyAttack · suite',
    'term.3': 'cat doc/SWC-AUDIT.md | head',
    'term.4': 'Vulnerable: 0 · Informational: 4 · Mitigated/N/A: 32',
    'term.5': 'echo status',
    'term.6': 'MODULE_05_CLOSED · GAS_OPT_CLOSED · SWC_CLOSED',

    'at.eyebrow': '// 06 — ATTACK CAMPAIGNS',
    'at.title': 'Defensive, not offensive',
    'at.lead':
      'Each campaign is a Foundry test where the “attack” must fail. No exploit PoCs: reentrancy via malicious seller/buyer, listing integrity, royalty/fee split, and price fuzzing.',
    'cA.t': 'Reentrancy',
    'cA.d': 'MaliciousActor seller/buyer on buy/cancel.',
    'cB.t': 'Escrow',
    'cB.d': 'List → cancel → re-list → buy e2e.',
    'cC.t': 'Royalties',
    'cC.d': 'Fee + ERC-2981 split with on-chain cap.',
    'cD.t': 'Fuzz',
    'cD.d': 'price / feeBps / royalty with bound().',
    'cE.t': 'Design',
    'cE.d': 'ETH DoS, approve race, deploy fee trust.',

    're.eyebrow': '// 07 — OPEN SOURCE',
    're.title': 'Repositories',
    're.lead':
      'The same codebase is on GitHub and GitLab: contract, tests, gas report, SWC audit, and demo UI.',
    're.cta': 'Contact',
    're.linkedin': 'LinkedIn',

    'ft.left': 'ROLANDO STRAHM — NFT Marketplace Escrow · Portfolio',
    'ft.right': 'FOUNDRY · SOLC 0.8.24 · ALL_SYSTEMS_OPERATIONAL',
  },
};

function setLanguage(lang) {
  const dict = I18N[lang] || I18N.es;
  document.documentElement.lang = dict['html.lang'];
  document.title = dict['meta.title'];

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && dict['meta.description']) {
    metaDesc.setAttribute('content', dict['meta.description']);
  }

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = dict[key];
    if (val == null) return;
    if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
    else el.textContent = val;
  });

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('nft-marketplace-portfolio-lang', lang);

  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
}

function initI18n() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('lang');
  const saved = localStorage.getItem('nft-marketplace-portfolio-lang');
  const preferred =
    (fromQuery === 'en' || fromQuery === 'es' ? fromQuery : null) ||
    saved ||
    (navigator.language?.startsWith('en') ? 'en' : 'es');

  setLanguage(preferred);

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
}

document.addEventListener('DOMContentLoaded', initI18n);
