/******************************************************************************

Welcome to GDB Online.
  GDB online is an online compiler and debugger tool for C, C++, Python, PHP, Ruby, 
  C#, OCaml, VB, Perl, Swift, Prolog, Javascript, Pascal, COBOL, HTML, CSS, JS
  Code, Compile, Run and Debug online from anywhere in world.

*******************************************************************************/
#include <stdio.h>

int main()
{
    printf("Hello World");

    return 0;
}
; x64 Assembly Example with AVX-512
vmovaps zmm0, [vec1]   ; Load vector 1
vmovaps zmm1, [vec2]   ; Load vector 2
vaddps zmm2, zmm0, zmm1 ; Add vectors
vmovaps [result], zmm2 ; Store result
hlt                     ; Halt execution
Program execution completed
Executing program...

Line 1: ; x64 Assembly Example with AVX-512
Line 2: vmovaps zmm0, [vec1]   ; Load vector 1
Line 3: vmovaps zmm1, [vec2]   ; Load vector 2
Line 4: vaddps zmm2, zmm0, zmm1 ; Add vectors
Line 5: vmovaps [result], zmm2 ; Store result
Line 6: hlt                     ; Halt execution

Program execution completed!