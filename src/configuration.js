
export class Configuration {
    


    // Defaults //

    static defaultResolveModuleFn(importer, name) {
        return name;
    }

    static defaultLoadModuleFn(name) {
        return null;
    }

    static defaultBindForeignMethodFn(module, className, isStatic, signature) {
        return null;
    }

    static defaultBindForeignClassFn(vm, module, className) {
        return null;
    }

    static defaultWriteFn(toLog) {
        let str = 'WRENJS:\n';
        console.log(str + toLog);
    }

    static defaultErrorFn(errorType, module, line, msg) {
        let str = 'WRENJS:\n';
        if (errorType == 0) {
          console.warn(
              str + "["+module+" line " +line+ "] [Error] "+msg+"\n"
          );
        }
        if (errorType == 1) {
          console.warn(
              str + "["+module+" line "+line+"] in "+msg+"\n"
          );
        }
        if (errorType == 2) {
          console.warn(
              str + "[Runtime Error] "+msg+"\n"
          );
        }
    }
}
