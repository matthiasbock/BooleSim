targets, factors
CycD, CycD
Rb, (! CycA & ! CycB & ! CycD & ! CycE) | (p27 & ! CycB & ! CycD)
E2F, (! Rb & ! CycA & ! CycB) | (p27 & ! Rb & ! CycB)
CycE, (E2F & ! Rb)
CycA, (E2F & ! Rb & ! Cdc20 & ! (Cdh1 & UbcH10)) | (CycA & ! Rb & ! Cdc20 & ! (Cdh1 & UbcH10))
p27, (! CycD & ! CycE & ! CycA & ! CycB) | (p27 & ! (CycE & CycA) & ! CycB &! CycD)
Cdc20, CycB
Cdh1,(! CycA & ! CycB) | (Cdc20) | (p27 & ! CycB)
UbcH10, ! Cdh1 | (Cdh1 & UbcH10 & (Cdc20 | CycA | CycB))
CycB, ! Cdc20 & ! Cdh1
